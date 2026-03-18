/**
 * API Route: Analytics Cache
 * GET: Fetch cached or fresh analytics
 * POST: Manually refresh cache
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { AnalyticsCacheService } from '@/lib/services/analytics-cache-service-postgres'

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get churchId from query params
    const churchId = request.nextUrl.searchParams.get('churchId')
    const forceRefresh = request.nextUrl.searchParams.get('forceRefresh') === 'true'

    if (!churchId) {
      return NextResponse.json({ error: 'churchId is required' }, { status: 400 })
    }

    // Get analytics (cached or fresh)
    const analytics = await AnalyticsCacheService.getAnalytics(churchId, forceRefresh)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error in GET /api/analytics/cache:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { churchId } = body

    if (!churchId) {
      return NextResponse.json({ error: 'churchId is required' }, { status: 400 })
    }

    // Refresh cache
    const analytics = await AnalyticsCacheService.refreshAnalyticsCache(churchId)

    return NextResponse.json({
      success: true,
      analytics,
      message: 'Cache refreshed successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/analytics/cache:', error)
    return NextResponse.json(
      { error: 'Failed to refresh cache' },
      { status: 500 }
    )
  }
}
