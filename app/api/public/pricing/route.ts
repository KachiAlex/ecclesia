import { NextResponse } from 'next/server'
import { SubscriptionPlanService } from '@/lib/services/subscription-service'
import { SubscriptionPricingService } from '@/lib/services/subscription-pricing-service'

export const dynamic = 'force-dynamic'

function serializePlan(plan: Awaited<ReturnType<typeof SubscriptionPlanService.findAll>>[number]) {
  const numericPrice = typeof plan.price === 'number' ? plan.price : Number(plan.price) || 0
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: numericPrice,
    currency: plan.currency || 'USD',
    billingCycle: plan.billingCycle,
    features: Array.isArray(plan.features) ? plan.features : [],
    type: plan.type,
    trialDays: plan.trialDays ?? 0,
    updatedAt: plan.updatedAt?.toISOString?.() ?? null,
  }
}

function serializePromo(promo: Awaited<ReturnType<typeof SubscriptionPricingService.listPromos>>[number]) {
  return {
    code: promo.code,
    type: promo.type,
    value: promo.value,
    appliesTo: promo.appliesTo,
    planIds: promo.planIds || [],
    churchIds: promo.churchIds || [],
    status: promo.status || 'active',
    validFrom: promo.validFrom?.toISOString?.(),
    validTo: promo.validTo?.toISOString?.(),
    notes: promo.notes,
  }
}

export async function GET() {
  try {
    const [plans, promos] = await Promise.all([
      SubscriptionPlanService.findAll(),
      SubscriptionPricingService.listPromos(),
    ])

    const activePromos = promos.filter((promo) => SubscriptionPricingService.isPromoActive(promo))

    return NextResponse.json({
      plans: plans.map(serializePlan),
      promos: activePromos.map(serializePromo),
    })
  } catch (error: any) {
    console.error('[public.pricing] error', error)
    return NextResponse.json({ error: error?.message || 'Failed to load pricing' }, { status: 500 })
  }
}
