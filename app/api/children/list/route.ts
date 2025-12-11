import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import { UserService } from '@/lib/services/user-service'
import { ChildrenCheckInService } from '@/lib/services/children-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    // Get user's children
    const allUsers = await UserService.findByChurch(church.id)
    const children = allUsers
      .filter(user => user.parentId === userId)
      .sort((a, b) => a.firstName.localeCompare(b.firstName))

    // Get current check-in status and counts for each child
    const childrenWithStatus = await Promise.all(
      children.map(async (child) => {
        const activeCheckIn = await ChildrenCheckInService.findActiveByChild(child.id)

        // Get counts
        const [checkInsCount, readingPlansCount, badgesCount] = await Promise.all([
          db.collection(COLLECTIONS.childrenCheckIns).where('childId', '==', child.id).count().get(),
          db.collection(COLLECTIONS.readingPlanProgress).where('userId', '==', child.id).count().get(),
          db.collection(COLLECTIONS.userBadges).where('userId', '==', child.id).count().get(),
        ])

        return {
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          dateOfBirth: child.dateOfBirth,
          profileImage: child.profileImage,
          role: child.role,
          xp: child.xp || 0,
          level: child.level || 1,
          isCheckedIn: !!activeCheckIn,
          checkInInfo: activeCheckIn ? {
            id: activeCheckIn.id,
            checkedInAt: activeCheckIn.checkedInAt,
            qrCode: activeCheckIn.qrCode,
          } : null,
          _count: {
            childrenCheckIns: checkInsCount.data().count || 0,
            readingPlans: readingPlansCount.data().count || 0,
            badges: badgesCount.data().count || 0,
          },
        }
      })
    )

    return NextResponse.json(childrenWithStatus)
  } catch (error) {
    console.error('Error fetching children:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

