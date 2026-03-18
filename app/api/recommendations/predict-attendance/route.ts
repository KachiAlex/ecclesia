import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { RecommendationService } from '@/lib/services/recommendation-service'

/**
 * GET /api/recommendations/predictions
 * Fetch recent attendance predictions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // In production, fetch from Firestore
    // For now, return empty array
    return NextResponse.json({ success: true, predictions: [] })
  } catch (error) {
    console.error('GET /api/recommendations/predictions failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch predictions', details: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recommendations/predict-attendance
 * Generate attendance prediction for an event
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { eventType, dayOfWeek, timeOfDay, historicalEvents, specialFactors } = body

    // If no historical events provided, return prediction based on request
    const prediction = await RecommendationService.predictEventAttendance(
      session.user.churchId,
      {
        eventType: eventType || 'service',
        dayOfWeek: dayOfWeek || 'Sunday',
        timeOfDay: timeOfDay || 'morning',
        historicalEvents: historicalEvents || [],
        specialFactors: specialFactors || [],
      }
    )

    return NextResponse.json({ success: true, prediction })
  } catch (error) {
    console.error('POST /api/recommendations/predict-attendance failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate prediction', details: (error as Error).message },
      { status: 500 }
    )
  }
}
