
export const dynamic = 'force-dynamic'
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

  const { church, userId, role } = guarded.ctx
  const unit = await UnitService.findById(params.unitId)
  if (!unit || unit.churchId !== church.id) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
  }

  const membership = await UnitMembershipService.findByUserAndUnit(userId, unit.id)
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const isHead = membership?.role === 'HEAD'
  if (!isAdmin && !isHead) {
    return NextResponse.json({ error: 'Not allowed to update unit details' }, { status: 403 })
  }

  const body = await request.json()
  const patch: any = {}

  if (body?.name !== undefined) patch.name = String(body.name)
  if (body?.description !== undefined) patch.description = body.description ? String(body.description) : undefined
  if (body?.branchId !== undefined) patch.branchId = body.branchId ? String(body.branchId) : undefined

  if (isAdmin) {
    if (body?.headUserId !== undefined) patch.headUserId = String(body.headUserId)

    if (body?.permissions?.invitePolicy !== undefined) {
      const val = String(body.permissions.invitePolicy)
      if (val !== 'HEAD_ONLY' && val !== 'ANY_MEMBER') {
        return NextResponse.json({ error: 'Invalid invitePolicy' }, { status: 400 })
      }
      patch.permissions = {
        ...(unit.permissions || {}),
        invitePolicy: val,
      }
    }
  }

  const updated = await UnitService.update(unit.id, patch)
  return NextResponse.json({ unit: updated })
}
