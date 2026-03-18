/**
 * API Route: Analytics Cache Status
 * GET: Check cache health and data quality without fetching full snapshot
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
    if (!churchId) {
      return NextResponse.json({ error: 'churchId is required' }, { status: 400 })
    }

    // Get cached analytics
    const cached = await AnalyticsCacheService.getCachedAnalytics(churchId)

    if (!cached) {
      return NextResponse.json({
        churchId,
        cacheExists: false,
        isValid: false,
        lastUpdated: null,
        nextRefresh: null,
        cacheAge: null,
        dataQuality: {
          dataCompleteness: 0,
          eventsCount: 0,
          membersCount: 0,
          avgEventAttendance: 0,
        },
        qualityScore: 0,
        recommendation: 'insufficient-data',
      })
    }

    const now = new Date()
    const cacheAge = Math.round((now.getTime() - cached.lastUpdated.getTime()) / 60000) // minutes
    const isValid = AnalyticsCacheService.isCacheValid(cached.nextRefresh)

    const qualityScore = cached.quality.dataCompleteness

    // Recommendation logic
    let recommendation: 'ok' | 'refresh' | 'insufficient-data' = 'ok'
    if (!isValid || cacheAge > 55) {
      recommendation = 'refresh'
    }
    if (qualityScore < 50) {
      recommendation = 'insufficient-data'
    }

    return NextResponse.json({
      churchId,
      cacheExists: true,
      isValid,
      lastUpdated: cached.lastUpdated,
      nextRefresh: cached.nextRefresh,
      cacheAge,
      dataQuality: cached.quality,
      qualityScore,
      recommendation,
    })
  } catch (error) {
    console.error('Error in GET /api/analytics/cache/status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cache status' },
      { status: 500 }
    )
  }
}
