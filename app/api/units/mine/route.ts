import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UnitMembershipService, UnitService } from '@/lib/services/unit-service'

export async function GET() {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church, userId } = guarded.ctx

  const memberships = await UnitMembershipService.findByUser(userId)
  const unitIds = Array.from(new Set(memberships.map((m) => m.unitId)))

  const unitsRaw = await Promise.all(unitIds.map((id) => UnitService.findById(id)))
  const units = unitsRaw.filter((u): u is NonNullable<typeof u> => Boolean(u)).filter((u) => u.churchId === church!.id)

  const membershipByUnitId: Record<string, any> = {}
  memberships.forEach((m) => {
    membershipByUnitId[m.unitId] = m
  })

  return NextResponse.json({
    units: units.map((u) => ({
      ...u,
      myRole: membershipByUnitId[u.id]?.role,
    })),
  })
}
