import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { LICENSING_PLANS } from '@/lib/licensing/plans'
import { SubscriptionPlanService } from '@/lib/services/subscription-service'

export const dynamic = 'force-dynamic'

export async function POST() {
  const guarded = await guardApi({ allowedRoles: ['SUPER_ADMIN'] })
  if (!guarded.ok) return guarded.response

  try {
    const synced = []
    for (const config of LICENSING_PLANS) {
      const plan = await SubscriptionPlanService.ensurePlanFromConfig(config)
      synced.push({ id: plan.id, name: plan.name, tier: config.tier })
    }

    return NextResponse.json({ synced, count: synced.length })
  } catch (error: any) {
    console.error('Error syncing licensing plans:', error)
    return NextResponse.json({ error: error.message || 'Failed to sync plans' }, { status: 500 })
  }
}
