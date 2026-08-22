
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { ChurchInviteService } from '@/lib/services/church-invite-service'
import { UserService } from '@/lib/services/user-service'
import { resolveBranchScope, hasBranchAccess } from '@/lib/services/branch-scope'
import type { UserRole } from '@/types'

const ALLOWED_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'SUPER_ADMIN', 'BRANCH_ADMIN']

export async function POST(
  _: Request,
  { params }: { params: { inviteId: string } }
) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: ALLOWED_ROLES })
    if (!guarded.ok) return guarded.response

    const { church, role, userId } = guarded.ctx
    const invite = await ChurchInviteService.findById(params.inviteId)

    if (!invite || invite.churchId !== church!.id) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    if (role === 'BRANCH_ADMIN') {
      if (!invite.branchId) {
        return NextResponse.json({ error: 'You cannot revoke church-wide invites' }, { status: 403 })
      }
      const user = await UserService.findById(userId)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      const scope = await resolveBranchScope(church!.id, user)
      const { allowed } = hasBranchAccess(scope, invite.branchId)
      if (!allowed) {
        return NextResponse.json({ error: 'You do not have permission for this branch' }, { status: 403 })
      }
    }

    const revoked = await ChurchInviteService.revoke(invite.id)
    return NextResponse.json({ invite: revoked })
  } catch (error: any) {
    console.error('Error revoking church invite:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
