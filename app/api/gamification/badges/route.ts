
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { BadgeService, UserBadgeService } from '@/lib/services/badge-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const userIdParam = searchParams.get('userId')

    // Get badges
    const badges = await BadgeService.findAll(type || undefined)

    // Get user count for each badge
    const badgesWithCounts = await Promise.all(
      badges.map(async (badge) => {
        const userCountSnapshot = await db.collection(COLLECTIONS.userBadges)
          .where('badgeId', '==', badge.id)
          .count()
          .get()

        return {
          ...badge,
          _count: {
            users: userCountSnapshot.data().count || 0,
          },
        }
      })
    )

    // If userId provided, check which badges user has
    if (userIdParam || userId) {
      const targetUserId = userIdParam || userId
      const userBadges = await UserBadgeService.findByUser(targetUserId)
      const userBadgeIds = new Set(userBadges.map((b) => b.badgeId))

      const badgesWithStatus = badgesWithCounts.map((badge) => ({
        ...badge,
        earned: userBadgeIds.has(badge.id),
      }))

      return NextResponse.json(badgesWithStatus)
    }

    return NextResponse.json(badgesWithCounts)
  } catch (error) {
    console.error('Error fetching badges:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (!['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, type, icon, xpReward } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    const badge = await BadgeService.create({
      name,
      description,
      type,
      icon: icon || undefined,
      xpReward: xpReward || 0,
    })

    return NextResponse.json(badge, { status: 201 })
  } catch (error: any) {
    console.error('Error creating badge:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
