import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { buildReadingCoachContext } from '@/lib/reading-coach/context'
import { getReadingCoachResponse } from '@/lib/ai/openai'
import { ReadingCoachSessionService } from '@/lib/services/reading-coach-service'

export async function POST(request: Request) {
  try {
    const guard = await guardApi()
    if (!guard.ok) return guard.response
    const { userId } = guard.ctx

    const body = await request.json().catch(() => ({}))
    const { question, planId, dayNumber } = body || {}

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 })
    }

    const contextResult = await buildReadingCoachContext({
      userId,
      planId,
      dayNumber: typeof dayNumber === 'number' ? dayNumber : undefined,
    })

    const coachResponse = await getReadingCoachResponse({
      question,
      context: contextResult.context,
    })

    const sessionRecord = await ReadingCoachSessionService.create({
      userId,
      planId,
      dayNumber: contextResult.day?.dayNumber,
      question,
      answer: coachResponse.answer,
      actionStep: coachResponse.actionStep,
      encouragement: coachResponse.encouragement,
      scriptures: coachResponse.scriptures,
      followUpQuestion: coachResponse.followUpQuestion,
      metadata: {
        insights: coachResponse.insights,
        context: contextResult.context,
      },
    })

    return NextResponse.json({
      sessionId: sessionRecord.id,
      question,
      ...coachResponse,
      insights: coachResponse.insights,
      context: contextResult,
    })
  } catch (error: any) {
    console.error('Reading coach session error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process reading coach request.' },
      { status: 500 }
    )
  }
}
