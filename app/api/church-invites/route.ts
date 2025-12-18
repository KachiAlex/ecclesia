import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { ChurchInviteService } from '@/lib/services/church-invite-service'
import { BranchService } from '@/lib/services/branch-service'

export async function GET() {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'PASTOR', 'SUPER_ADMIN'] })
    if (!guarded.ok) return guarded.response

    const { church } = guarded.ctx

    const active = await ChurchInviteService.findActiveByChurch(church!.id, 'MEMBER_SIGNUP')

    return NextResponse.json({ invite: active })
  } catch (error: any) {
    console.error('Error getting church invite:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'PASTOR', 'SUPER_ADMIN'] })
    if (!guarded.ok) return guarded.response

    const { userId, church } = guarded.ctx

    const body = await request.json().catch(() => ({}))
    const branchId = body?.branchId ? String(body.branchId) : undefined

    if (branchId) {
      const branch = await BranchService.findById(branchId)
      if (!branch || branch.churchId !== church!.id) {
        return NextResponse.json({ error: 'Invalid branch' }, { status: 400 })
      }
    }

    const existing = await ChurchInviteService.findActiveByChurch(church!.id, 'MEMBER_SIGNUP')
    if (existing) {
      await ChurchInviteService.revoke(existing.id)
    }

    const { invite, token } = await ChurchInviteService.createActive({
      churchId: church!.id,
      createdByUserId: userId,
      purpose: 'MEMBER_SIGNUP',
      branchId,
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/invite/${token}` : null

    return NextResponse.json({ invite, token, url }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating church invite:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
