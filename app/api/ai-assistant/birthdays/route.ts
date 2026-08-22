import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { AIAssistantService } from '@/lib/services/ai-assistant-service'
import { getCurrentChurchId } from '@/lib/church-context'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const churchId = await getCurrentChurchId(userId)

    if (!churchId) {
      return NextResponse.json({ error: 'No church found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const birthdays = await AIAssistantService.getUpcomingBirthdays(churchId, days)

    return NextResponse.json({ birthdays })
  } catch (error) {
    console.error('Error fetching birthdays:', error)
    return NextResponse.json({ error: 'Failed to fetch birthdays' }, { status: 500 })
  }
}
