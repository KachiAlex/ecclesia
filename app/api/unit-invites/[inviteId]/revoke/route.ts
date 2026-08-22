
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UnitInviteService, UnitMembershipService, UnitService } from '@/lib/services/unit-service'

export async function POST(_: Request, { params }: { params: { inviteId: string } }) {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church, userId } = guarded.ctx
  const invite = await UnitInviteService.findById(params.inviteId)
  if (!invite || invite.churchId !== church!.id) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  if (invite.status !== 'PENDING') {
    return NextResponse.json({ error: 'Invite is not pending' }, { status: 409 })
  }

  const unit = await UnitService.findById(invite.unitId)
  if (!unit || unit.churchId !== church!.id) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
  }

  const membership = await UnitMembershipService.findByUserAndUnit(userId, unit.id)
  if (!membership || membership.role !== 'HEAD') {
    return NextResponse.json({ error: 'Only unit heads can revoke invites' }, { status: 403 })
  }

  const updated = await UnitInviteService.updateStatus(invite.id, 'REVOKED')
  return NextResponse.json({ invite: updated })
}
