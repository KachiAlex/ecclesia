import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UnitTypeService, UnitTypeJoinPolicy, UnitTypeCreationPolicy } from '@/lib/services/unit-type-service'

export async function GET() {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church } = guarded.ctx
  const types = await UnitTypeService.findByChurch(church.id)
  return NextResponse.json({ unitTypes: types })
}

export async function POST(request: Request) {
  const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'SUPER_ADMIN'] })
  if (!guarded.ok) return guarded.response

  const { church } = guarded.ctx
  const body = await request.json()

  const name = String(body?.name || '').trim()
  const description = body?.description ? String(body.description) : undefined
  const allowMultiplePerUser = Boolean(body?.allowMultiplePerUser)
  const joinPolicy = (body?.joinPolicy || 'INVITE_ONLY') as UnitTypeJoinPolicy
  const creationPolicy = (body?.creationPolicy || 'ADMIN_ONLY') as UnitTypeCreationPolicy

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const created = await UnitTypeService.create({
    churchId: church.id,
    name,
    description,
    allowMultiplePerUser,
    joinPolicy,
    creationPolicy,
  })

  return NextResponse.json({ unitType: created }, { status: 201 })
}
