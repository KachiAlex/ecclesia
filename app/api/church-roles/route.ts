
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { RoleService } from '@/lib/services/role-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'SUPER_ADMIN', 'BRANCH_ADMIN']

export async function GET() {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const roles = await RoleService.listByChurch(guarded.ctx.church!.id)
    return NextResponse.json(roles)
  } catch (error: any) {
    console.error('ChurchRoles.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load roles' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const body = await request.json().catch(() => ({}))
    const name = body?.name?.trim()
    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 })
    }

    const role = await RoleService.create({
      churchId: guarded.ctx.church!.id,
      name,
      description: body?.description?.trim(),
    })

    return NextResponse.json(role, { status: 201 })
  } catch (error: any) {
    console.error('ChurchRoles.POST', error)
    return NextResponse.json({ error: error.message || 'Failed to create role' }, { status: 500 })
  }
}
