import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth-options'
import { SurveyService } from '@/lib/services/survey-service'

export async function POST(
  _request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const survey = await SurveyService.publishSurvey(params.surveyId, session.user.id)
    return NextResponse.json({ survey })
  } catch (error) {
    console.error('Error publishing survey:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to publish survey'

    const status =
      message === 'Unauthorized to publish this survey'
        ? 403
        : message === 'Only draft surveys can be published'
          ? 400
          : 500

    return NextResponse.json({ error: message }, { status })
  }
}
