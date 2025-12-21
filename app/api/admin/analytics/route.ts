import { NextResponse } from 'next/server'
import { hasPermission } from '@/lib/permissions'
import { UserService } from '@/lib/services/user-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { CheckInService } from '@/lib/services/checkin-service'
import { guardApi } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { role, userId, church } = guarded.ctx

    if (!role || !hasPermission(role, 'view_analytics')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    // Get date ranges
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thisYear = new Date(now.getFullYear(), 0, 1)

    // Get all users in church
    const allUsers = await UserService.findByChurch(church.id)
    const totalUsers = allUsers.length

    // Active users (logged in this month)
    const activeUsers = allUsers.filter(user => 
      user.lastLoginAt && new Date(user.lastLoginAt) >= thisMonth
    ).length

    // Sermon views this month
    const sermonsSnapshot = await db.collection(COLLECTIONS.sermons)
      .where('churchId', '==', church.id)
      .get()
    const sermonIds = sermonsSnapshot.docs.map((doc: any) => doc.id)
    
    let sermonViews = 0
    for (const sermonId of sermonIds) {
      const viewsSnapshot = await db.collection(COLLECTIONS.sermonViews)
        .where('sermonId', '==', sermonId)
        .where('createdAt', '>=', thisMonth)
        .count()
        .get()
      sermonViews += viewsSnapshot.data().count || 0
    }

    // Prayer requests this month
    const prayerRequestsSnapshot = await db.collection(COLLECTIONS.prayerRequests)
      .where('churchId', '==', church.id)
      .where('createdAt', '>=', thisMonth)
      .count()
      .get()
    const prayerRequests = prayerRequestsSnapshot.data().count || 0

    // Total giving this month
    let totalGiving = 0
    for (const user of allUsers) {
      const givingSnapshot = await db.collection(COLLECTIONS.donations)
        .where('userId', '==', user.id)
        .where('createdAt', '>=', thisMonth)
        .get()
      const userGiving = givingSnapshot.docs.reduce((sum: number, doc: any) => {
        const data = doc.data()
        return sum + (data.amount || 0)
      }, 0)
      totalGiving += userGiving
    }

    // Events this month
    const eventsSnapshot = await db.collection(COLLECTIONS.events)
      .where('churchId', '==', church.id)
      .where('startDate', '>=', thisMonth)
      .count()
      .get()
    const eventsCount = eventsSnapshot.data().count || 0

    // Check-ins this month
    const checkIns = await CheckInService.countByChurch(church.id, thisMonth)

    // Recent posts
    const postsSnapshot = await db.collection(COLLECTIONS.posts)
      .where('churchId', '==', church.id)
      .where('createdAt', '>=', thisMonth)
      .count()
      .get()
    const recentPosts = postsSnapshot.data().count || 0

    // Users by role
    const usersByRoleMap = new Map<string, number>()
    allUsers.forEach(user => {
      const count = usersByRoleMap.get(user.role) || 0
      usersByRoleMap.set(user.role, count + 1)
    })
    const usersByRole = Array.from(usersByRoleMap.entries()).map(([role, count]) => ({
      role,
      count,
    }))

    // Disengaged users (haven't logged in 30+ days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const disengagedUsers = allUsers
      .filter(user => 
        user.role !== 'VISITOR' &&
        (!user.lastLoginAt || new Date(user.lastLoginAt) < thirtyDaysAgo)
      )
      .slice(0, 20)
      .map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        lastLoginAt: user.lastLoginAt,
        role: user.role,
      }))

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        sermonViews,
        prayerRequests,
        totalGiving,
        eventsCount,
        checkIns,
        recentPosts,
      },
      usersByRole: usersByRole,
      disengagedUsers,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

