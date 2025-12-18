import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { ChurchInviteService } from '@/lib/services/church-invite-service'

export async function POST(
  _: Request,
  { params }: { params: { inviteId: string } }
) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'PASTOR', 'SUPER_ADMIN'] })
    if (!guarded.ok) return guarded.response

    const { church } = guarded.ctx
    const invite = await ChurchInviteService.findById(params.inviteId)

    if (!invite || invite.churchId !== church!.id) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    const revoked = await ChurchInviteService.revoke(invite.id)
    return NextResponse.json({ invite: revoked })
  } catch (error: any) {
    console.error('Error revoking church invite:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
