import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { SubscriptionPricingService } from '@/lib/services/subscription-pricing-service'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: { code: string } },
) {
  const guarded = await guardApi({ allowedRoles: ['SUPER_ADMIN'] })
  if (!guarded.ok) return guarded.response

  try {
    const { code } = params
    const body = await request.json().catch(() => ({}))

    const updates: Record<string, any> = { ...body, updatedBy: guarded.ctx.userId }
    if (body.validFrom) updates.validFrom = new Date(body.validFrom)
    if (body.validTo) updates.validTo = new Date(body.validTo)

    const promo = await SubscriptionPricingService.updatePromo(code, updates)
    if (!promo) {
      return NextResponse.json({ error: 'Promo not found' }, { status: 404 })
    }

    return NextResponse.json({ promo })
  } catch (error: any) {
    console.error('Error updating promo:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { code: string } },
) {
  const guarded = await guardApi({ allowedRoles: ['SUPER_ADMIN'] })
  if (!guarded.ok) return guarded.response

  try {
    const { code } = params
    const promo = await SubscriptionPricingService.updatePromo(code, {
      status: 'inactive',
      updatedBy: guarded.ctx.userId,
    })

    if (!promo) {
      return NextResponse.json({ error: 'Promo not found' }, { status: 404 })
    }

    return NextResponse.json({ promo })
  } catch (error: any) {
    console.error('Error deleting promo:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
