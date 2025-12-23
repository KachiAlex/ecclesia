import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { DesignationService } from '@/lib/services/designation-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

export async function GET() {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const designations = await DesignationService.listByChurch(guarded.ctx.church!.id)
    return NextResponse.json(designations)
  } catch (error: any) {
    console.error('Designations.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load designations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const body = await request.json()
    if (!body?.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const designation = await DesignationService.create({
      churchId: guarded.ctx.church!.id,
      name: body.name.trim(),
      description: body.description?.trim(),
      category: body.category,
    })

    return NextResponse.json(designation, { status: 201 })
  } catch (error: any) {
    console.error('Designations.POST', error)
    return NextResponse.json({ error: error.message || 'Failed to create designation' }, { status: 500 })
  }
}
