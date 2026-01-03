import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { SurveyService } from '@/lib/services/survey-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const data = await request.json()

    // Get client IP for anonymous surveys
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const response = await SurveyService.submitResponse(
      params.surveyId,
      session?.user?.id || null,
      data,
      ip,
      userAgent
    )

    return NextResponse.json({ response }, { status: 201 })
  } catch (error) {
    console.error('Error submitting survey response:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit response' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const responses = await SurveyService.getSurveyResponses(
      params.surveyId,
      session.user.id
    )

    return NextResponse.json({ responses })
  } catch (error) {
    console.error('Error fetching survey responses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch survey responses' },
      { status: 500 }
    )
  }
}