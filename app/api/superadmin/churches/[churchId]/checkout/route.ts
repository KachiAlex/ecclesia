import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { PaymentService } from '@/lib/services/payment-service'
import { SubscriptionPlanService, SubscriptionService } from '@/lib/services/subscription-service'
import { SubscriptionPaymentService } from '@/lib/services/subscription-payment-service'
import { SubscriptionPricingService } from '@/lib/services/subscription-pricing-service'
import { db, FieldValue } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ churchId: string }> }
) {
  try {
    const { churchId } = await params
    const guarded = await guardApi({ allowedRoles: ['SUPER_ADMIN'] })
    if (!guarded.ok) return guarded.response

    const body = await request.json().catch(() => ({}))
    const { planId, promoCode } = body

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    const plan = await SubscriptionPlanService.findById(planId)
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const subscription = await SubscriptionService.findByChurch(churchId)
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    const pricing = await SubscriptionPricingService.calculateEffectivePrice({
      planId,
      churchId,
      basePrice: plan.price || 0,
      promoCode,
    })
    const amount = pricing.amount
    const currency = plan.currency || 'USD'

    // If plan is free, switch immediately without payment
    if (amount <= 0) {
      await db.collection(COLLECTIONS.subscriptions).doc(subscription.id).update({
        planId,
        status: subscription.status === 'SUSPENDED' ? 'ACTIVE' : subscription.status,
        updatedAt: FieldValue.serverTimestamp(),
      })

      const updated = await SubscriptionService.findByChurch(churchId)
      return NextResponse.json({
        subscription: updated,
        message: `Plan changed to ${plan.name}`,
      })
    }

    const sessionUser = guarded.ctx.session.user as any
    const payerName =
      `${sessionUser?.firstName || ''} ${sessionUser?.lastName || ''}`.trim() || 'Superadmin'

    const checkout = await PaymentService.initializePayment({
      amount,
      currency,
      email: sessionUser?.email || 'billing@ecclesia.app',
      name: payerName,
      metadata: {
        kind: 'subscription_upgrade',
        churchId,
        planId,
        initiatedBy: guarded.ctx.userId,
        promoCode: pricing.appliedPromo?.code || pricing.override?.promoCode,
        basePrice: pricing.breakdown.basePrice,
        overridePrice: pricing.breakdown.overridePrice,
        discountAmount: pricing.breakdown.discount,
      },
      title: `${plan.name} Subscription`,
      description: `Upgrade ${churchId} to ${plan.name}`,
      redirectUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/superadmin/churches`,
    })

    if (!checkout.success || !checkout.authorizationUrl || !checkout.reference) {
      return NextResponse.json(
        { error: checkout.error || 'Failed to initialize Flutterwave checkout' },
        { status: 400 }
      )
    }

    await SubscriptionPaymentService.create({
      reference: checkout.reference,
      churchId,
      planId,
      amount,
      currency,
      initiatedBy: guarded.ctx.userId,
      authorizationUrl: checkout.authorizationUrl,
      metadata: {
        planName: plan.name,
        currentPlanId: subscription.planId,
        promoCode: pricing.appliedPromo?.code || pricing.override?.promoCode,
        basePrice: pricing.breakdown.basePrice,
        overridePrice: pricing.breakdown.overridePrice,
        discountAmount: pricing.breakdown.discount,
      },
    })

    return NextResponse.json({
      authorizationUrl: checkout.authorizationUrl,
      reference: checkout.reference,
      message: `Redirecting to Flutterwave to upgrade to ${plan.name}`,
    })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
