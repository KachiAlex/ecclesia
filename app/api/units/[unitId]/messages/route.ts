export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UnitService, UnitMembershipService } from '@/lib/services/unit-service'
import { UnitMessageService, UnitSettingsService } from '@/lib/services/unit-engagement-service'
import { UserService } from '@/lib/services/user-service'

const serializeDate = (value: Date | string | null | undefined) => {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : value
}

const serializeMessage = (message: any, user: any) => ({
  id: message.id,
  unitId: message.unitId,
  churchId: message.churchId,
  userId: message.userId,
  content: message.content,
  attachments: message.attachments || [],
  voiceNote: message.voiceNote || null,
  pinned: Boolean(message.pinned),
  metadata: message.metadata || null,
  createdAt: serializeDate(message.createdAt),
  updatedAt: serializeDate(message.updatedAt),
  user: user
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
    return NextResponse.json({ error: 'Not authorized to view messages' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limitParam = Number(searchParams.get('limit') || 100)
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 100

  const messages = await UnitMessageService.listByUnit(unit.id, limit)
  const uniqueUserIds = Array.from(new Set(messages.map((msg) => msg.userId))).slice(0, 200)
  const users = await Promise.all(uniqueUserIds.map((id) => UserService.findById(id)))
  const userMap = users.reduce<Record<string, any>>((map, user) => {
    if (user) map[user.id] = user
    return map
  }, {})

  return NextResponse.json({
    messages: messages.map((message) => serializeMessage(message, userMap[message.userId])),
  })
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
  if (!membership && !isAdmin) {
    return NextResponse.json({ error: 'Not authorized to post messages' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const content = typeof body?.content === 'string' ? body.content.trim() : ''
  const attachments = Array.isArray(body?.attachments) ? body.attachments : undefined
  const voiceNote = body?.voiceNote && typeof body.voiceNote === 'object' ? body.voiceNote : undefined
  const metadata = body?.metadata && typeof body.metadata === 'object' ? body.metadata : undefined

  if (!content && (!attachments || attachments.length === 0) && !voiceNote) {
    return NextResponse.json({ error: 'Message content or attachment required' }, { status: 400 })
  }

  const settings = await UnitSettingsService.getOrCreate(church.id, unit.id)
  if (!settings.allowMedia && ((attachments && attachments.length > 0) || voiceNote)) {
    return NextResponse.json({ error: 'Media sharing is disabled for this group' }, { status: 403 })
  }

  const message = await UnitMessageService.create({
    unitId: unit.id,
    churchId: church.id,
    userId,
    content,
    attachments,
    voiceNote,
    metadata,
  })

  const user = await UserService.findById(userId)

  return NextResponse.json({ message: serializeMessage(message, user) }, { status: 201 })
}
