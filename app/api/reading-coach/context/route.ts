
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { buildReadingCoachContext } from '@/lib/reading-coach/context'
import { ReadingCoachSessionService, ReadingCoachNudgeService } from '@/lib/services/reading-coach-service'

export async function GET(request: Request) {
  try {
    const guard = await guardApi()
    if (!guard.ok) return guard.response
    const { userId } = guard.ctx

    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId') || undefined
    const dayNumberParam = searchParams.get('dayNumber')
    const dayNumber = dayNumberParam ? Number(dayNumberParam) : undefined

    const contextResult = await buildReadingCoachContext({
      userId,
      planId,
      dayNumber: Number.isFinite(dayNumber) ? dayNumber : undefined,
    })

    const recentSessions = await ReadingCoachSessionService.findByUser(userId, 5)
    const pendingNudges = await ReadingCoachNudgeService.listPending(userId)

    return NextResponse.json({
      context: contextResult,
      recentSessions,
      pendingNudges,
    })
  } catch (error: any) {
    console.error('Reading coach context error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load reading coach context.' },
      { status: 500 }
    )
  }
}
