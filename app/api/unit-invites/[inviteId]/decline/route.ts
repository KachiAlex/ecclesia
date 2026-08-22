
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UnitInviteService } from '@/lib/services/unit-service'

export async function POST(_: Request, { params }: { params: { inviteId: string } }) {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church, userId } = guarded.ctx
  const invite = await UnitInviteService.findById(params.inviteId)
  if (!invite || invite.churchId !== church!.id) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }
  if (invite.invitedUserId !== userId) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }
  if (invite.status !== 'PENDING') {
    return NextResponse.json({ error: 'Invite is not pending' }, { status: 409 })
  }

  const updated = await UnitInviteService.updateStatus(invite.id, 'DECLINED')
  return NextResponse.json({ invite: updated })
}
