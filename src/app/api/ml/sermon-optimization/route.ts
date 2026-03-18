/**
 * API Route: Sermon Optimization
 * Endpoint: GET /api/ml/sermon-optimization
 * Recommends sermon topics, timing, and content strategies
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { mlPredictionService } from '@/lib/services/ml-prediction-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const churchId = searchParams.get('churchId')

    if (!churchId) {
      return NextResponse.json(
        { error: 'churchId is required' },
        { status: 400 }
      )
    }

    const optimization = await mlPredictionService.optimizeSermonStrategy(churchId)

    if (!optimization) {
      return NextResponse.json(
        {
          error: 'Unable to generate recommendations',
          reason: 'Insufficient sermon/content data'
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      optimization,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Sermon optimization error:', error)
    return NextResponse.json(
      { error: 'Failed to optimize sermon strategy' },
      { status: 500 }
    )
  }
}
