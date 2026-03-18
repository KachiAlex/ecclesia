/**
 * API Route: Attendance Predictions
 * Endpoint: GET /api/ml/attendance
 * Predicts attendance for upcoming events
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { mlPredictionService } from '@/lib/services/ml-prediction-service'
import { prisma } from '@/lib/prisma'

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
    const eventType = searchParams.get('eventType') || 'SERVICE'
    const daysUntilEvent = parseInt(searchParams.get('daysUntilEvent') || '30')

    if (!churchId) {
      return NextResponse.json(
        { error: 'churchId is required' },
        { status: 400 }
      )
    }

    const prediction = await mlPredictionService.predictEventAttendance(
      churchId,
      eventType,
      daysUntilEvent
    )

    if (!prediction) {
      return NextResponse.json(
        {
          error: 'Unable to generate prediction',
          reason: 'Insufficient historical data'
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      prediction,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Attendance prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to predict attendance' },
      { status: 500 }
    )
  }
}
