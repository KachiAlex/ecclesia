import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { RoleService } from '@/lib/services/role-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'SUPER_ADMIN', 'BRANCH_ADMIN']

type RouteParams = {
  params: {
    roleId: string
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const roleId = params.roleId
    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const name = body?.name?.trim()
    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 })
    }

    const role = await RoleService.update(roleId, guarded.ctx.church!.id, {
      name,
      description: body?.description?.trim(),
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json(role)
  } catch (error: any) {
    console.error('ChurchRoles.PATCH', error)
    return NextResponse.json({ error: error.message || 'Failed to update role' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const roleId = params.roleId
    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    await RoleService.delete(roleId, guarded.ctx.church!.id)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('ChurchRoles.DELETE', error)
    return NextResponse.json({ error: error.message || 'Failed to delete role' }, { status: 500 })
  }
}
