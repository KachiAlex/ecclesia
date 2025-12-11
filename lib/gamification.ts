import { UserService } from './services/user-service'
import { BadgeService, UserBadgeService } from './services/badge-service'
import { ReadingPlanProgressService } from './services/reading-plan-service'
import { db } from './firestore'
import { COLLECTIONS } from './firestore-collections'

/**
 * Award XP to a user
 */
export async function awardXP(userId: string, amount: number, reason?: string) {
  const user = await UserService.findById(userId)

  if (!user) {
    return null
  }

  const newXP = (user.xp || 0) + amount
  const newLevel = calculateLevel(newXP)

  const updated = await UserService.update(userId, {
    xp: newXP,
    level: newLevel,
  })

  // Check for level-up badges
  await checkLevelUpBadges(userId, newLevel)

  return updated
}

/**
 * Calculate level from XP
 */
export function calculateLevel(xp: number): number {
  // Level formula: level = floor(sqrt(xp / 100)) + 1
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

/**
 * Check and award badges based on user activity
 */
export async function checkAndAwardBadges(userId: string) {
  const user = await UserService.findById(userId)

  if (!user) {
    return []
  }

  const awardedBadges: string[] = []
  const userBadges = await UserBadgeService.findByUser(userId)
  const existingBadgeIds = new Set(userBadges.map((b) => b.badgeId))

  // Get counts
  const [prayerRequestsCount, sermonsWatchedCount, givingCount, eventsAttendedCount, volunteerShiftsCount] = await Promise.all([
    db.collection(COLLECTIONS.prayerRequests).where('userId', '==', userId).count().get(),
    db.collection(COLLECTIONS.sermonViews).where('userId', '==', userId).count().get(),
    db.collection(COLLECTIONS.giving).where('userId', '==', userId).count().get(),
    db.collection(COLLECTIONS.eventAttendances).where('userId', '==', userId).count().get(),
    db.collection(COLLECTIONS.volunteerShifts).where('userId', '==', userId).count().get(),
  ])

  // Get all badges
  const allBadges = await BadgeService.findAll()

  for (const badge of allBadges) {
    if (existingBadgeIds.has(badge.id)) {
      continue // Already has this badge
    }

    let shouldAward = false

    switch (badge.type) {
      case 'PRAYER_STREAK':
        // Check prayer streak (simplified - would need actual streak calculation)
        if ((prayerRequestsCount.data().count || 0) >= 7) {
          shouldAward = true
        }
        break

      case 'READING_PLAN':
        // Check reading plan completion
        const completedPlansSnapshot = await db.collection(COLLECTIONS.readingPlanProgress)
          .where('userId', '==', userId)
          .where('completed', '==', true)
          .count()
          .get()
        if ((completedPlansSnapshot.data().count || 0) >= 1) {
          shouldAward = true
        }
        break

      case 'GIVING':
        if ((givingCount.data().count || 0) >= 10) {
          shouldAward = true
        }
        break

      case 'EVENT_ATTENDANCE':
        if ((eventsAttendedCount.data().count || 0) >= 5) {
          shouldAward = true
        }
        break

      case 'SERVING':
        if ((volunteerShiftsCount.data().count || 0) >= 10) {
          shouldAward = true
        }
        break

      case 'EVANGELISM':
        // Check if user has brought visitors (simplified)
        const visitorsBroughtSnapshot = await db.collection(COLLECTIONS.users)
          .where('parentId', '==', userId)
          .where('role', '==', 'VISITOR')
          .count()
          .get()
        if ((visitorsBroughtSnapshot.data().count || 0) >= 1) {
          shouldAward = true
        }
        break
    }

    if (shouldAward) {
      await UserBadgeService.create(userId, badge.id)

      // Award XP for badge
      if (badge.xpReward > 0) {
        await awardXP(userId, badge.xpReward, `Badge: ${badge.name}`)
      }

      awardedBadges.push(badge.id)
    }
  }

  return awardedBadges
}

/**
 * Check for level-up badges
 */
async function checkLevelUpBadges(userId: string, level: number) {
  const allBadges = await BadgeService.findAll()
  const levelBadges = allBadges.filter(badge => 
    badge.type === 'OTHER' && badge.name.includes('Level')
  )

  for (const badge of levelBadges) {
    const levelMatch = badge.name.match(/Level (\d+)/)
    if (levelMatch && parseInt(levelMatch[1]) === level) {
      const existing = await UserBadgeService.findByUserAndBadge(userId, badge.id)

      if (!existing) {
        await UserBadgeService.create(userId, badge.id)
      }
    }
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(
  churchId: string,
  type: 'global' | 'department' | 'group' | 'family' = 'global',
  filterId?: string
) {
  let users = await UserService.findByChurch(churchId, 100)

  // Filter by type
  if (type === 'department' && filterId) {
    // Filter users in department
    const departmentSnapshot = await db.collection(COLLECTIONS.departments).doc(filterId).get()
    const department = departmentSnapshot.data()
    if (department?.members) {
      users = users.filter(user => department.members.includes(user.id))
    }
  } else if (type === 'group' && filterId) {
    // Filter users in group
    const groupSnapshot = await db.collection(COLLECTIONS.groups).doc(filterId).get()
    const group = groupSnapshot.data()
    if (group?.members) {
      users = users.filter(user => group.members.includes(user.id))
    }
  } else if (type === 'family' && filterId) {
    // Filter family members
    users = users.filter(user => 
      user.parentId === filterId || 
      user.id === filterId || 
      user.spouseId === filterId
    )
  }

  // Sort by XP and get badges
  users = users.sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 100)

  const usersWithBadges = await Promise.all(
    users.map(async (user) => {
      const userBadges = await UserBadgeService.findByUser(user.id)
      const badges = await Promise.all(
        userBadges.map(async (ub) => {
          const badge = await BadgeService.findById(ub.badgeId)
          return badge
        })
      )

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        xp: user.xp || 0,
        level: user.level || 1,
        badges: badges.filter(Boolean).map(badge => ({ badge })),
      }
    })
  )

  return usersWithBadges.map((user, index) => ({
    rank: index + 1,
    ...user,
  }))
}

