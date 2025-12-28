export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UnitService, UnitMembershipService } from '@/lib/services/unit-service'
import { UnitPollService, UnitSettingsService } from '@/lib/services/unit-engagement-service'
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

export async function GET(request: Request, { params }: { params: { unitId: string } }) {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church, userId, role } = guarded.ctx
  const unit = await UnitService.findById(params.unitId)
  if (!unit || unit.churchId !== church.id) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
  }

  const membership = await UnitMembershipService.findByUserAndUnit(userId, unit.id)
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  if (!membership && !isAdmin) {
    return NextResponse.json({ error: 'Not authorized to view polls' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limitParam = Number(searchParams.get('limit') || 50)
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 50

  const polls = await UnitPollService.findByUnit(unit.id, limit)
  const uniqueUserIds = Array.from(new Set(polls.map((poll) => poll.createdByUserId))).slice(0, 200)
  const users = await Promise.all(uniqueUserIds.map((id) => UserService.findById(id)))
  const userMap = users.reduce<Record<string, any>>((map, user) => {
    if (user) map[user.id] = user
    return map
  }, {})

  return NextResponse.json({ polls: polls.map((poll) => serializePoll(poll, userMap[poll.createdByUserId])) })
}

export async function POST(request: Request, { params }: { params: { unitId: string } }) {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church, userId, role } = guarded.ctx
  const unit = await UnitService.findById(params.unitId)
  if (!unit || unit.churchId !== church.id) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
  }

  const membership = await UnitMembershipService.findByUserAndUnit(userId, unit.id)
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const isHead = membership?.role === 'HEAD'
  if (!isAdmin && !isHead) {
    return NextResponse.json({ error: 'Only leaders can create polls' }, { status: 403 })
  }

  const settings = await UnitSettingsService.getOrCreate(church.id, unit.id)
  if (!settings.allowPolls) {
    return NextResponse.json({ error: 'Polls are disabled for this group' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const question = typeof body?.question === 'string' ? body.question.trim() : ''
  const description = typeof body?.description === 'string' ? body.description.trim() : undefined
  const allowMultiple = Boolean(body?.allowMultiple)
  const allowComments = body?.allowComments === undefined ? true : Boolean(body.allowComments)
  const closesAt = body?.closesAt ? new Date(body.closesAt) : undefined

  if (!question) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 })
  }

  if (!Array.isArray(body?.options) || body.options.length < 2) {
    return NextResponse.json({ error: 'At least two options are required' }, { status: 400 })
  }

  const options = body.options
    .map((option: any) => ({ label: typeof option?.label === 'string' ? option.label.trim() : '' }))
    .filter((option: { label: string }) => option.label.length > 0)

  if (options.length < 2) {
    return NextResponse.json({ error: 'Provide at least two valid option labels' }, { status: 400 })
  }

  const poll = await UnitPollService.create({
    unitId: unit.id,
    churchId: church.id,
    question,
    description,
    options,
    allowMultiple,
    allowComments,
    createdByUserId: userId,
    closesAt: closesAt && !Number.isNaN(closesAt.getTime()) ? closesAt : undefined,
  })

  const user = await UserService.findById(userId)
  return NextResponse.json({ poll: serializePoll(poll, user) }, { status: 201 })
}
