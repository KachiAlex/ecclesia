/**
 * API Route: ML Predictions
 * Endpoint: GET /api/ml/predictions
 * Provides access to various machine learning prediction models
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
    const type = searchParams.get('type') // 'attendance', 'giving', 'lifecycle', 'sermon', 'churn'
    const churchId = searchParams.get('churchId')
    const memberId = searchParams.get('memberId')
    const eventType = searchParams.get('eventType')
    const period = (searchParams.get('period') as '30-day' | '90-day' | '365-day') || '90-day'

    if (!churchId) {
      return NextResponse.json(
        { error: 'churchId is required' },
        { status: 400 }
      )
    }

    // Route to appropriate prediction model
    let result

    switch (type) {
      case 'attendance':
        result = await mlPredictionService.predictEventAttendance(
          churchId,
          eventType || 'SERVICE',
          30
        )
        if (!result) {
          return NextResponse.json(
            { error: 'Insufficient historical data for attendance prediction' },
            { status: 422 }
          )
        }
        break

      case 'giving':
        result = await mlPredictionService.forecastGiving(churchId, period)
        if (!result) {
          return NextResponse.json(
            { error: 'Insufficient historical data for giving forecast' },
            { status: 422 }
          )
        }
        break

      case 'lifecycle':
        if (!memberId) {
          return NextResponse.json(
            { error: 'memberId is required for lifecycle prediction' },
            { status: 400 }
          )
        }
        result = await mlPredictionService.predictMemberLifecycle(churchId, memberId)
        if (!result) {
          return NextResponse.json(
            { error: 'Member not found or insufficient data' },
            { status: 404 }
          )
        }
        break

      case 'sermon':
        result = await mlPredictionService.optimizeSermonStrategy(churchId)
        if (!result) {
          return NextResponse.json(
            { error: 'Insufficient content data for sermon optimization' },
            { status: 422 }
          )
        }
        break

      case 'churn':
        result = await mlPredictionService.analyzeChurnRisk(churchId)
        break

      default:
        return NextResponse.json(
          { error: `Unknown prediction type: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      type,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Prediction API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    )
  }
}
