export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UnitService, UnitMembershipService } from '@/lib/services/unit-service'
import { UnitPollService } from '@/lib/services/unit-engagement-service'
import { UserService } from '@/lib/services/user-service'

const serializeDate = (value: Date | string | null | undefined) => {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : value
}

const serializePoll = (poll: any, user: any) => ({
  id: poll.id,
  unitId: poll.unitId,
  churchId: poll.churchId,
  question: poll.question,
  description: poll.description || null,
  options: poll.options || [],
  allowMultiple: Boolean(poll.allowMultiple),
  allowComments: Boolean(poll.allowComments),
  status: poll.status,
  createdByUserId: poll.createdByUserId,
  closesAt: serializeDate(poll.closesAt),
  createdAt: serializeDate(poll.createdAt),
  updatedAt: serializeDate(poll.updatedAt),
  createdBy: user
    ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage || null,
      }
    : null,
})

export async function POST(request: Request, { params }: { params: { unitId: string; pollId: string } }) {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church, userId, role } = guarded.ctx
  const { unitId, pollId } = params

  const unit = await UnitService.findById(unitId)
  if (!unit || unit.churchId !== church.id) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
  }

  const membership = await UnitMembershipService.findByUserAndUnit(userId, unit.id)
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  if (!membership && !isAdmin) {
    return NextResponse.json({ error: 'Not authorized to vote on this poll' }, { status: 403 })
  }

  const poll = await UnitPollService.findById(pollId)
  if (!poll || poll.unitId !== unit.id) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const optionIds = Array.isArray(body?.optionIds) ? body.optionIds.map((id: unknown) => String(id)) : []
  if (optionIds.length === 0) {
    return NextResponse.json({ error: 'Select at least one option' }, { status: 400 })
  }

  try {
    const updatedPoll = await UnitPollService.vote(pollId, userId, optionIds)
    const creator = await UserService.findById(updatedPoll.createdByUserId)
    return NextResponse.json({ poll: serializePoll(updatedPoll, creator) })
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message : 'Unable to record vote'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
