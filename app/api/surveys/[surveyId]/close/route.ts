'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth-options'
import { SurveyService } from '@/lib/services/survey-service'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const survey = await SurveyService.closeSurvey(params.surveyId, session.user.id)
    return NextResponse.json({ survey })
  } catch (error) {
    console.error('Error closing survey:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to close survey'

    const status =
      message === 'Unauthorized to close this survey'
        ? 403
        : message === 'Only active surveys can be closed'
          ? 400
          : 500

    return NextResponse.json({ error: message }, { status })
  }
}
