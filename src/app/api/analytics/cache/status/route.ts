/**
 * API Route: Analytics Cache Status
 * GET: Check cache validity and data quality
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { AnalyticsCacheService } from '@/lib/services/analytics-cache-service'
import { DataAggregationService } from '@/lib/services/data-aggregation-service'
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

    const [cached, isValid, quality] = await Promise.all([
      AnalyticsCacheService.getCachedAnalytics(churchId),
      AnalyticsCacheService.isCacheValid(churchId),
      DataAggregationService.assessDataQuality(churchId),
    ])

    return NextResponse.json({
      churchId,
      cacheExists: !!cached,
      isValid,
      lastUpdated: cached?.lastUpdated || null,
      nextRefresh: cached?.nextRefresh || null,
      cacheAge: cached
        ? Math.round((new Date().getTime() - new Date(cached.lastUpdated).getTime()) / 1000 / 60) // minutes
        : null,
      dataQuality: quality,
      qualityScore: quality.dataCompleteness,
      recommendation:
        !isValid && quality.dataCompleteness > 60
          ? 'refresh'
          : quality.dataCompleteness < 40
            ? 'insufficient-data'
            : 'ok',
    })
  } catch (error) {
    console.error('Error checking cache status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
