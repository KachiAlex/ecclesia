import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { SurveyService } from '@/lib/services/survey-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const churchId = searchParams.get('churchId')
    
    if (!churchId) {
      return NextResponse.json({ error: 'Church ID required' }, { status: 400 })
    }

    const surveys = await SurveyService.getSurveysForUser(
      session.user.id,
      churchId,
      { status: ['ACTIVE'] }
    )

    return NextResponse.json({ surveys })
  } catch (error) {
    console.error('Error fetching available surveys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available surveys' },
      { status: 500 }
    )
  }
}