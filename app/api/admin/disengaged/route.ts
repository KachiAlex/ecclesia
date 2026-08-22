import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { UserService } from '@/lib/services/user-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { getCurrentChurch } from '@/lib/church-context'
import { requirePermissionMiddleware } from '@/lib/middleware/rbac'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { error: permError } = await requirePermissionMiddleware('view_analytics')
    if (permError) {
      return permError
    }

    const session = await getServerSession(authOptions)
    const userId = (session?.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const daysInactive = parseInt(searchParams.get('days') || '30')

    const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000)

    // Get all users in church
    const allUsers = await UserService.findByChurch(church.id)
    
    // Find disengaged users
    const disengagedUsers = allUsers
      .filter(user => 
        user.role !== 'VISITOR' &&
        (!user.lastLoginAt || new Date(user.lastLoginAt) < cutoffDate)
      )
      .sort((a, b) => {
        if (!a.lastLoginAt) return -1
        if (!b.lastLoginAt) return 1
        return new Date(a.lastLoginAt).getTime() - new Date(b.lastLoginAt).getTime()
      })
      .slice(0, 100)

    // Calculate engagement scores
    const usersWithScores = await Promise.all(
      disengagedUsers.map(async (user) => {
        const daysSinceLogin = user.lastLoginAt
          ? Math.floor(
              (Date.now() - new Date(user.lastLoginAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 999

        // Get counts
        const [sermonsWatched, giving, eventsAttended, prayerRequests, posts] = await Promise.all([
          db.collection(COLLECTIONS.sermonViews).where('userId', '==', user.id).count().get(),
          db.collection(COLLECTIONS.giving).where('userId', '==', user.id).count().get(),
          db.collection(COLLECTIONS.eventAttendances).where('userId', '==', user.id).count().get(),
          db.collection(COLLECTIONS.prayerRequests).where('userId', '==', user.id).count().get(),
          db.collection(COLLECTIONS.posts).where('userId', '==', user.id).count().get(),
        ])

        const engagementScore =
          (sermonsWatched.data().count || 0) * 2 +
          (giving.data().count || 0) * 3 +
          (eventsAttended.data().count || 0) * 2 +
          (prayerRequests.data().count || 0) * 1 +
          (posts.data().count || 0) * 1

        return {
          ...user,
          daysSinceLogin,
          engagementScore,
          riskLevel:
            daysSinceLogin > 90
              ? 'HIGH'
              : daysSinceLogin > 60
              ? 'MEDIUM'
              : 'LOW',
          _count: {
            sermonsWatched: sermonsWatched.data().count || 0,
            giving: giving.data().count || 0,
            eventsAttended: eventsAttended.data().count || 0,
            prayerRequests: prayerRequests.data().count || 0,
            posts: posts.data().count || 0,
          },
        }
      })
    )

    return NextResponse.json({
      users: usersWithScores,
      summary: {
        total: usersWithScores.length,
        highRisk: usersWithScores.filter((u) => u.riskLevel === 'HIGH').length,
        mediumRisk: usersWithScores.filter((u) => u.riskLevel === 'MEDIUM').length,
        lowRisk: usersWithScores.filter((u) => u.riskLevel === 'LOW').length,
      },
    })
  } catch (error) {
    console.error('Error fetching disengaged users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

