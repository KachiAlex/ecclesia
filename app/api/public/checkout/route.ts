import { NextResponse } from 'next/server'
import { SubscriptionPlanService } from '@/lib/services/subscription-service'
import { SubscriptionPricingService } from '@/lib/services/subscription-pricing-service'
import { PaymentService } from '@/lib/services/payment-service'
import { LandingPaymentService } from '@/lib/services/landing-payment-service'

export const dynamic = 'force-dynamic'

type CheckoutRequest = {
  planId?: string
  fullName?: string
  email?: string
  churchName?: string
  phone?: string
  promoCode?: string
  notes?: string
}

function parseAmount(value: unknown, fallback = 0) {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CheckoutRequest | null

  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { planId, fullName, email, churchName, phone, promoCode, notes } = body

  if (!planId || !fullName || !email) {
    return NextResponse.json({ error: 'Plan, name, and email are required' }, { status: 400 })
  }

  try {
    const plan = await SubscriptionPlanService.findById(planId)
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const basePrice = Math.max(0, parseAmount(plan.price, 0))
    const currency = plan.currency || 'USD'

    // Free plans don’t require payment; point users to signup directly.
    if (basePrice <= 0) {
      return NextResponse.json({
        signupUrl: `/auth/register?plan=${plan.id}`,
        message: 'This plan is free to start. Continue to registration to activate your account.',
      })
    }

    let amount = basePrice
    let appliedPromoCode: string | undefined

    if (promoCode) {
      const promo = await SubscriptionPricingService.getPromo(promoCode)
      if (promo && SubscriptionPricingService.isPromoActive(promo)) {
        const applies = SubscriptionPricingService.promoAppliesTo(promo, plan.id, '')
        if (applies) {
          amount = SubscriptionPricingService.applyDiscount(amount, promo)
          appliedPromoCode = promo.code
        }
      }
    }

    if (amount <= 0) {
      return NextResponse.json({
        signupUrl: `/auth/register?plan=${plan.id}`,
        message: 'Promo applied. Continue to registration to activate your plan.',
      })
    }

    const reference = `landing_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    await LandingPaymentService.create({
      reference,
      planId: plan.id,
      planName: plan.name,
      amount,
      currency,
      fullName,
      email,
      churchName,
      phone,
      promoCode: appliedPromoCode,
      notes,
      status: 'INITIATED',
    })

    const payment = await PaymentService.initializePayment({
      reference,
      amount,
      currency,
      email,
      name: fullName,
      phone,
      title: `${plan.name} Subscription`,
      description: `Secure checkout for ${plan.name} plan`,
      metadata: {
        kind: 'landing_subscription',
        planId: plan.id,
        planName: plan.name,
        promoCode: appliedPromoCode,
        churchName,
        notes,
        leadEmail: email,
        leadName: fullName,
      },
    })

    if (!payment.success || !payment.authorizationUrl || !payment.reference) {
      await LandingPaymentService.markFailed(reference, payment.error || 'Failed to initialize payment')
      return NextResponse.json(
        { error: payment.error || 'Failed to initialize payment' },
        { status: 400 }
      )
    }

    await LandingPaymentService.update(reference, {
      authorizationUrl: payment.authorizationUrl,
    })

    return NextResponse.json({
      authorizationUrl: payment.authorizationUrl,
      reference: payment.reference,
      amount,
      currency,
    })

  } catch (error: any) {
    if (error?.reference) {
      await LandingPaymentService.markFailed(error.reference, error.message)
    }
    console.error('[public.checkout] error', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
