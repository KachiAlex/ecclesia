export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  StaffLevelService,
  STAFF_PAY_FREQUENCIES,
} from '@/lib/services/staff-level-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'SUPER_ADMIN']

type RouteParams = {
  params: {
    staffLevelId: string
  }
}

const isValidCurrency = (value: unknown) => typeof value === 'string' && /^[A-Z]{3}$/.test(value.trim())
const isValidAmount = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const staffLevelId = params.staffLevelId
    if (!staffLevelId) {
      return NextResponse.json({ error: 'Staff level ID is required' }, { status: 400 })
    }

    const churchId = guarded.ctx.church!.id
    const existing = await StaffLevelService.get(churchId, staffLevelId)
    if (!existing) {
      return NextResponse.json({ error: 'Staff level not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const updates: Record<string, any> = {}

    if (body?.name !== undefined) {
      const name = String(body.name).trim()
      if (!name) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
      updates.name = name
    }

    if (body?.description !== undefined) {
      updates.description = String(body.description).trim()
    }

    if (body?.defaultWageAmount !== undefined) {
      const amount = typeof body.defaultWageAmount === 'number'
        ? body.defaultWageAmount
        : Number(body.defaultWageAmount)
      if (!isValidAmount(amount)) {
        return NextResponse.json({ error: 'Enter a valid wage amount greater than 0' }, { status: 400 })
      }
      updates.defaultWageAmount = amount
    }

    if (body?.currency !== undefined) {
      const currency = String(body.currency).trim().toUpperCase()
      if (!isValidCurrency(currency)) {
        return NextResponse.json({ error: 'Currency must be a 3-letter ISO code' }, { status: 400 })
      }
      updates.currency = currency
    }

    if (body?.payFrequency !== undefined) {
      const payFrequency = String(body.payFrequency).toLowerCase()
      if (!STAFF_PAY_FREQUENCIES.includes(payFrequency as any)) {
        return NextResponse.json({ error: 'Invalid pay frequency' }, { status: 400 })
      }
      updates.payFrequency = payFrequency
    }

    if (body?.order !== undefined) {
      const order = Number(body.order)
      if (!Number.isFinite(order)) {
        return NextResponse.json({ error: 'Order must be a number' }, { status: 400 })
      }
      updates.order = order
    }

    const updated = await StaffLevelService.update(churchId, staffLevelId, updates)
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('StaffLevels.PATCH', error)
    return NextResponse.json({ error: error.message || 'Failed to update staff level' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const staffLevelId = params.staffLevelId
    if (!staffLevelId) {
      return NextResponse.json({ error: 'Staff level ID is required' }, { status: 400 })
    }

    await StaffLevelService.delete(guarded.ctx.church!.id, staffLevelId)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('StaffLevels.DELETE', error)
    return NextResponse.json({ error: error.message || 'Failed to delete staff level' }, { status: 500 })
  }
}
