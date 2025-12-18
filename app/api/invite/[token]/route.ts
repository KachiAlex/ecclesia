import { NextResponse } from 'next/server'
import { ChurchInviteService, hashInviteToken } from '@/lib/services/church-invite-service'
import { ChurchService } from '@/lib/services/church-service'
import { BranchService } from '@/lib/services/branch-service'
import { UserService } from '@/lib/services/user-service'

export async function GET(
  _: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = String(params.token || '').trim()
    if (!token) return NextResponse.json({ error: 'Invalid invite token' }, { status: 400 })

    const tokenHash = hashInviteToken(token)
    const invite = await ChurchInviteService.findByTokenHash(tokenHash)

    if (!invite || invite.purpose !== 'MEMBER_SIGNUP') {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    if (invite.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Invite is no longer active' }, { status: 410 })
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
    }

    const church = await ChurchService.findById(invite.churchId)
    if (!church) return NextResponse.json({ error: 'Church not found' }, { status: 404 })

    const branches = await BranchService.findByChurch(invite.churchId)

    return NextResponse.json({
      invite: {
        id: invite.id,
        churchId: invite.churchId,
        branchId: invite.branchId || null,
        purpose: invite.purpose,
      },
      church: {
        id: church.id,
        name: (church as any).name,
      },
      branches: branches.map((b) => ({ id: b.id, name: b.name })),
    })
  } catch (error: any) {
    console.error('Error loading invite context:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = String(params.token || '').trim()
    if (!token) return NextResponse.json({ error: 'Invalid invite token' }, { status: 400 })

    const tokenHash = hashInviteToken(token)
    const invite = await ChurchInviteService.findByTokenHash(tokenHash)

    if (!invite || invite.purpose !== 'MEMBER_SIGNUP') {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    if (invite.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Invite is no longer active' }, { status: 410 })
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
    }

    const body = await request.json().catch(() => ({}))

    const firstName = String(body?.firstName || '').trim()
    const lastName = String(body?.lastName || '').trim()
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const phone = body?.phone ? String(body.phone).trim() : undefined
    const address = body?.address ? String(body.address).trim() : undefined
    const employmentStatus = body?.employmentStatus ? String(body.employmentStatus).trim() : undefined

    const dateOfBirthRaw = body?.dateOfBirth ? String(body.dateOfBirth).trim() : ''
    const dateOfBirth = dateOfBirthRaw || undefined

    const branchId = body?.branchId ? String(body.branchId).trim() : invite.branchId

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await UserService.findByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    if (branchId) {
      const branch = await BranchService.findById(branchId)
      if (!branch || branch.churchId !== invite.churchId) {
        return NextResponse.json({ error: 'Invalid branch' }, { status: 400 })
      }
    }

    const created = await UserService.create({
      firstName,
      lastName,
      email,
      password,
      role: 'MEMBER',
      churchId: invite.churchId,
      branchId: branchId || undefined,
      phone: phone || undefined,
      address: address || undefined,
      dateOfBirth: dateOfBirth || undefined,
      employmentStatus: employmentStatus || undefined,
    } as any)

    await ChurchInviteService.markUsed(invite.id, created.id)

    const { password: _, ...userWithoutPassword } = created as any

    return NextResponse.json({ user: userWithoutPassword }, { status: 201 })
  } catch (error: any) {
    console.error('Error accepting invite signup:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
