import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { AICoachingSessionService } from '@/lib/services/ai-service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const sessions = await AICoachingSessionService.findByUser(userId, limit)

    return NextResponse.json(sessions.map(s => ({
      id: s.id,
      question: s.question,
      answer: s.answer,
      topic: s.topic,
      createdAt: s.createdAt,
    })))
  } catch (error) {
    console.error('Error fetching coaching history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

