/**
 * API Route: Analytics Cache - Get cached analytics
 * GET: Fetch cached analytics with datacompleteness
 * POST: Manually refresh analytics cache
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { AnalyticsCacheService } from '@/lib/services/analytics-cache-service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const churchId = req.nextUrl.searchParams.get('churchId')
    if (!churchId) {
      return NextResponse.json({ error: 'churchId is required' }, { status: 400 })
    }

    const useCache = req.nextUrl.searchParams.get('forceRefresh') !== 'true'
    const analytics = await AnalyticsCacheService.getAnalytics(churchId, !useCache)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics cache:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { churchId } = body

    if (!churchId) {
      return NextResponse.json({ error: 'churchId is required' }, { status: 400 })
    }

    const analytics = await AnalyticsCacheService.refreshAnalyticsCache(churchId)

    return NextResponse.json({
      success: true,
      analytics,
      message: 'Analytics cache refreshed successfully',
    })
  } catch (error) {
    console.error('Error refreshing analytics cache:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
