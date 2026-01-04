import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { SurveyService } from '@/lib/services/survey-service'
import type { UserRole } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = ((session.user as unknown as { role?: UserRole })?.role ?? 'MEMBER') as UserRole

    const insights = await SurveyService.getSurveyInsights(
      params.surveyId,
      session.user.id,
      userRole
    )

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Error fetching survey insights:', error)

    const message = error instanceof Error ? error.message : 'Failed to fetch survey insights'
    const status = message === 'Survey not found'
      ? 404
      : message === 'Unauthorized to view survey insights'
        ? 403
        : 500

    return NextResponse.json({ error: message }, { status })
  }
}
