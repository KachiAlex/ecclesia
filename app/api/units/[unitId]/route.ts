import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UnitService, UnitMembershipService } from '@/lib/services/unit-service'

export async function GET(_: Request, { params }: { params: { unitId: string } }) {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church, userId } = guarded.ctx
  const unit = await UnitService.findById(params.unitId)
  if (!unit || unit.churchId !== church.id) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
  }

  const members = await UnitMembershipService.findByUnit(unit.id)
  const myMembership = await UnitMembershipService.findByUserAndUnit(userId, unit.id)
  return NextResponse.json({ unit, members, myMembership })
}

export async function PATCH(request: Request, { params }: { params: { unitId: string } }) {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church, userId } = guarded.ctx
  const unit = await UnitService.findById(params.unitId)
  if (!unit || unit.churchId !== church.id) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
  }

  const membership = await UnitMembershipService.findByUserAndUnit(userId, unit.id)
  if (!membership || membership.role !== 'HEAD') {
    return NextResponse.json({ error: 'Only unit heads can update unit details' }, { status: 403 })
  }

  const body = await request.json()
  const patch: any = {}
  if (body?.name !== undefined) patch.name = String(body.name)
  if (body?.description !== undefined) patch.description = body.description ? String(body.description) : undefined
  if (body?.branchId !== undefined) patch.branchId = body.branchId ? String(body.branchId) : undefined

  const updated = await UnitService.update(unit.id, patch)
  return NextResponse.json({ unit: updated })
}
