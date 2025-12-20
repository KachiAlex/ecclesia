import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { ReadingCoachNudgeService } from '@/lib/services/reading-coach-service'

export async function GET(request: Request) {
  try {
    const guard = await guardApi()
    if (!guard.ok) return guard.response
    const { userId } = guard.ctx

    const pendingNudges = await ReadingCoachNudgeService.listPending(userId)
    return NextResponse.json({ nudges: pendingNudges })
  } catch (error: any) {
    console.error('Error listing reading coach nudges:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load nudges.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const guard = await guardApi()
    if (!guard.ok) return guard.response
    const { userId } = guard.ctx

    const body = await request.json().catch(() => ({}))
    const { message, type = 'reminder', planId, scheduledAt, metadata } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
    }

    const nudge = await ReadingCoachNudgeService.create({
      userId,
      planId,
      type,
      message,
      status: scheduledAt ? 'pending' : 'sent',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      metadata,
    })

    return NextResponse.json({ nudge }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating reading coach nudge:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create nudge.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const guard = await guardApi()
    if (!guard.ok) return guard.response
    const { userId } = guard.ctx

    const body = await request.json().catch(() => ({}))
    const { nudgeId, status } = body

    if (!nudgeId || !status) {
      return NextResponse.json(
        { error: 'nudgeId and status are required.' },
        { status: 400 }
      )
    }

    const existing = await ReadingCoachNudgeService.findById(nudgeId)
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Nudge not found.' }, { status: 404 })
    }

    await ReadingCoachNudgeService.updateStatus(nudgeId, status)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating reading coach nudge:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update nudge.' },
      { status: 500 }
    )
  }
}
