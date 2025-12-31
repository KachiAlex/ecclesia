export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UnitService, UnitMembershipService } from '@/lib/services/unit-service'
import { UnitSettingsService } from '@/lib/services/unit-engagement-service'

export async function GET(_: Request, { params }: { params: { unitId: string } }) {
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
    return NextResponse.json({ error: 'Not authorized to view settings' }, { status: 403 })
  }

  const settings = await UnitSettingsService.getOrCreate(church.id, unit.id)
  return NextResponse.json({ settings })
}

export async function PUT(request: Request, { params }: { params: { unitId: string } }) {
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
    return NextResponse.json({ error: 'Not authorized to update settings' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const patch: any = {}

  if (body?.allowMedia !== undefined) patch.allowMedia = Boolean(body.allowMedia)
  if (body?.allowPolls !== undefined) patch.allowPolls = Boolean(body.allowPolls)
  if (body?.allowShares !== undefined) patch.allowShares = Boolean(body.allowShares)
  if (body?.pinnedRules !== undefined) {
    patch.pinnedRules = body.pinnedRules ? String(body.pinnedRules) : null
  }
  if (Array.isArray(body?.rules)) {
    patch.rules = body.rules
      .map((rule: any) => ({
        title: String(rule?.title || '').trim(),
        description: rule?.description ? String(rule.description) : undefined,
      }))
      .filter((rule: any) => rule.title.length > 0)
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  await UnitSettingsService.getOrCreate(church.id, unit.id)
  const settings = await UnitSettingsService.update(unit.id, patch)
  return NextResponse.json({ settings })
}
