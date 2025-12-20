import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { SubscriptionPlanService } from '@/lib/services/subscription-service'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: { planId: string } }
) {
  const guarded = await guardApi({ allowedRoles: ['SUPER_ADMIN'] })
  if (!guarded.ok) return guarded.response

  try {
    const { planId } = params
    const body = await request.json().catch(() => ({}))
    const { price, currency, billingCycle, description } = body

    const updates: Record<string, any> = {}

    if (price !== undefined) {
      if (typeof price !== 'number' || Number.isNaN(price) || price < 0) {
        return NextResponse.json({ error: 'Price must be a non-negative number' }, { status: 400 })
      }
      updates.price = price
    }

    if (currency !== undefined) {
      if (typeof currency !== 'string' || currency.trim().length === 0) {
        return NextResponse.json({ error: 'Currency must be a non-empty string' }, { status: 400 })
      }
      updates.currency = currency.toUpperCase()
    }

    if (billingCycle !== undefined) {
      if (!['monthly', 'annual'].includes(billingCycle)) {
        return NextResponse.json({ error: 'Billing cycle must be "monthly" or "annual"' }, { status: 400 })
      }
      updates.billingCycle = billingCycle
    }

    if (description !== undefined) {
      if (typeof description !== 'string') {
        return NextResponse.json({ error: 'Description must be a string' }, { status: 400 })
      }
      updates.description = description
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided to update' }, { status: 400 })
    }

    const updatedPlan = await SubscriptionPlanService.update(planId, updates)
    if (!updatedPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({ plan: updatedPlan })
  } catch (error: any) {
    console.error('Error updating plan:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
