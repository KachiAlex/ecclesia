import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { SubscriptionPricingService, DiscountType, PromoScope } from '@/lib/services/subscription-pricing-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guarded = await guardApi({ allowedRoles: ['SUPER_ADMIN'] })
  if (!guarded.ok) return guarded.response

  try {
    const promos = await SubscriptionPricingService.listPromos()
    return NextResponse.json({ promos })
  } catch (error: any) {
    console.error('Error listing promos:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const guarded = await guardApi({ allowedRoles: ['SUPER_ADMIN'] })
  if (!guarded.ok) return guarded.response

  try {
    const body = await request.json().catch(() => ({}))
    const { code, type, value, appliesTo, planIds, churchIds, maxRedemptions, validFrom, validTo, notes } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }
    if (!['percentage', 'flat'].includes(type)) {
      return NextResponse.json({ error: 'Invalid discount type' }, { status: 400 })
    }
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return NextResponse.json({ error: 'Value must be greater than 0' }, { status: 400 })
    }
    if (!['plan', 'church', 'global'].includes(appliesTo)) {
      return NextResponse.json({ error: 'Invalid scope' }, { status: 400 })
    }

    const promo = await SubscriptionPricingService.createPromo({
      code: code.toUpperCase(),
      type: type as DiscountType,
      value: numericValue,
      appliesTo: appliesTo as PromoScope,
      planIds: Array.isArray(planIds) ? planIds : undefined,
      churchIds: Array.isArray(churchIds) ? churchIds : undefined,
      maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validTo: validTo ? new Date(validTo) : undefined,
      notes,
      createdBy: guarded.ctx.userId,
      status: 'active',
      updatedBy: guarded.ctx.userId,
      redeemedCount: 0,
    } as any)

    return NextResponse.json({ promo }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating promo:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
