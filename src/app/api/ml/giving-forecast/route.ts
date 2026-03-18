/**
 * API Route: Giving Forecasts
 * Endpoint: GET /api/ml/giving-forecast
 * Forecasts giving trends for specified periods
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
    const period = (searchParams.get('period') as '30-day' | '90-day' | '365-day') || '90-day'

    if (!churchId) {
      return NextResponse.json(
        { error: 'churchId is required' },
        { status: 400 }
      )
    }

    const forecast = await mlPredictionService.forecastGiving(churchId, period)

    if (!forecast) {
      return NextResponse.json(
        {
          error: 'Unable to generate forecast',
          reason: 'Insufficient giving history'
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      forecast,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Giving forecast error:', error)
    return NextResponse.json(
      { error: 'Failed to forecast giving' },
      { status: 500 }
    )
  }
}
