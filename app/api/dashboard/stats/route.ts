
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
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

    // Get simple counts without date filters to avoid index requirements
    // We'll use simpler queries that don't require composite indexes
    const [
      sermonsCount,
      prayerRequestsCount,
      projectsCount,
      eventsCount,
      postsCount,
    ] = await Promise.all([
      // Total sermons count
      db.collection(COLLECTIONS.sermons)
        .where('churchId', '==', church.id)
        .count()
        .get()
        .catch(() => ({ data: () => ({ count: 0 }) })),
      // Total prayer requests count
      db.collection(COLLECTIONS.prayerRequests)
        .where('churchId', '==', church.id)
        .count()
        .get()
        .catch(() => ({ data: () => ({ count: 0 }) })),
      // Total projects count
      db.collection(COLLECTIONS.projects)
        .where('churchId', '==', church.id)
        .count()
        .get()
        .catch(() => ({ data: () => ({ count: 0 }) })),
      // Total events count
      db.collection(COLLECTIONS.events)
        .where('churchId', '==', church.id)
        .count()
        .get()
        .catch(() => ({ data: () => ({ count: 0 }) })),
      // Total posts count
      db.collection(COLLECTIONS.posts)
        .where('churchId', '==', church.id)
        .count()
        .get()
        .catch(() => ({ data: () => ({ count: 0 }) })),
    ])

    // Return simplified stats without month-over-month comparisons
    // These can be added later once Firestore indexes are created
    const stats = {
      sermonsWatched: {
        value: 0,
        change: '+0',
      },
      prayerRequests: {
        value: prayerRequestsCount.data().count || 0,
        change: '+0',
      },
      giving: {
        value: '$0',
        change: '+0%',
      },
      eventsAttended: {
        value: 0,
        change: '+0',
      },
    }

    const quickActions = {
      sermons: sermonsCount.data().count || 0,
      prayer: prayerRequestsCount.data().count || 0,
      giving: projectsCount.data().count || 0,
      events: eventsCount.data().count || 0,
      community: postsCount.data().count || 0,
    }

    return NextResponse.json({ stats, quickActions })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
