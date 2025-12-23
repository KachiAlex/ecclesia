import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { DesignationService } from '@/lib/services/designation-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

type RouteParams = {
  params: {
    designationId: string
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const designationId = params.designationId
    if (!designationId) {
      return NextResponse.json({ error: 'Designation ID is required' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const name = body?.name?.trim()
    if (!name) {
      return NextResponse.json({ error: 'Designation name is required' }, { status: 400 })
    }

    const designation = await DesignationService.update(designationId, guarded.ctx.church!.id, {
      name,
      description: body?.description?.trim(),
      category: body?.category?.trim(),
    })

    if (!designation) {
      return NextResponse.json({ error: 'Designation not found' }, { status: 404 })
    }

    return NextResponse.json(designation)
  } catch (error: any) {
    console.error('Designations.PATCH', error)
    return NextResponse.json({ error: error.message || 'Failed to update designation' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const designationId = params.designationId
    if (!designationId) {
      return NextResponse.json({ error: 'Designation ID is required' }, { status: 400 })
    }

    await DesignationService.delete(designationId, guarded.ctx.church!.id)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Designations.DELETE', error)
    return NextResponse.json({ error: error.message || 'Failed to delete designation' }, { status: 500 })
  }
}
