import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { SubscriptionPlanService } from '@/lib/services/subscription-service'
import { SubscriptionPricingService } from '@/lib/services/subscription-pricing-service'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { churchId: string } },
) {
  const guarded = await guardApi({ allowedRoles: ['SUPER_ADMIN'] })
  if (!guarded.ok) return guarded.response

  try {
    const { churchId } = params
    const body = await request.json().catch(() => ({}))
    const { planId, customPrice, customSetupFee, promoCode, expiresAt, notes } = body

    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 })
    }

    const plan = await SubscriptionPlanService.findById(planId)
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (customPrice !== undefined && (Number.isNaN(Number(customPrice)) || Number(customPrice) < 0)) {
      return NextResponse.json({ error: 'Custom price must be a non-negative number' }, { status: 400 })
    }
    if (customSetupFee !== undefined && (Number.isNaN(Number(customSetupFee)) || Number(customSetupFee) < 0)) {
      return NextResponse.json({ error: 'Custom setup fee must be a non-negative number' }, { status: 400 })
    }

    let promo = null
    if (promoCode) {
      promo = await SubscriptionPricingService.getPromo(promoCode)
      if (!promo) {
        return NextResponse.json({ error: 'Promo code not found' }, { status: 404 })
      }
      if (
        !SubscriptionPricingService.isPromoActive(promo) ||
        !SubscriptionPricingService.promoAppliesTo(promo, planId, churchId)
      ) {
        return NextResponse.json({ error: 'Promo code not active for this plan/church' }, { status: 400 })
      }
    }

    const override = await SubscriptionPricingService.setPlanOverride({
      planId,
      churchId,
      customPrice: customPrice !== undefined ? Number(customPrice) : undefined,
      customSetupFee: customSetupFee !== undefined ? Number(customSetupFee) : undefined,
      promoCode: promo?.code ?? (promoCode ? promoCode.toUpperCase() : undefined),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      notes,
      createdBy: guarded.ctx.userId,
    })

    return NextResponse.json({ override })
  } catch (error: any) {
    console.error('Error setting plan override:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { churchId: string } },
) {
  const guarded = await guardApi({ allowedRoles: ['SUPER_ADMIN'] })
  if (!guarded.ok) return guarded.response

  try {
    const { churchId } = params
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId')
    if (!planId) {
      return NextResponse.json({ error: 'planId query parameter is required' }, { status: 400 })
    }

    await SubscriptionPricingService.deletePlanOverride(planId, churchId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting plan override:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
