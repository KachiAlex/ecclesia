export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UnitService, UnitMembershipService } from '@/lib/services/unit-service'

export async function GET() {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church, userId } = guarded.ctx

  try {
    // Get user's memberships
    const memberships = await UnitMembershipService.findByUser(userId)
    
    // Get all units for the church
    const allUnits = await UnitService.findByChurch(church.id)
    
    // Filter to only units where user is a member
    const userUnitIds = memberships.map(m => m.unitId)
    const units = allUnits.filter(unit => userUnitIds.includes(unit.id))

    return NextResponse.json({ 
      units,
      memberships: memberships.map(m => ({
        id: m.id,
        unitId: m.unitId,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching user units:', error)
    return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 })
  }
}