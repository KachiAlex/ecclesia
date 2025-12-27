export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  StaffLevelService,
  STAFF_PAY_FREQUENCIES,
} from '@/lib/services/staff-level-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'SUPER_ADMIN']

const isValidCurrency = (value: unknown) => typeof value === 'string' && /^[A-Z]{3}$/.test(value.trim())

const isValidAmount = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0

export async function GET() {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const levels = await StaffLevelService.listByChurch(guarded.ctx.church!.id)
    return NextResponse.json(levels)
  } catch (error: any) {
    console.error('StaffLevels.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load staff levels' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const body = await request.json().catch(() => ({}))
    const name: string = body?.name?.trim()
    const description: string | undefined = body?.description?.trim()
    const amount = typeof body?.defaultWageAmount === 'number' ? body.defaultWageAmount : Number(body?.defaultWageAmount)
    const currency: string = body?.currency?.trim()?.toUpperCase()
    const payFrequency: string = body?.payFrequency?.toLowerCase()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!isValidAmount(amount)) {
      return NextResponse.json({ error: 'Enter a valid wage amount greater than 0' }, { status: 400 })
    }

    if (!isValidCurrency(currency)) {
      return NextResponse.json({ error: 'Currency must be a 3-letter ISO code' }, { status: 400 })
    }

    if (!STAFF_PAY_FREQUENCIES.includes(payFrequency as any)) {
      return NextResponse.json({ error: 'Invalid pay frequency' }, { status: 400 })
    }

    const level = await StaffLevelService.create({
      churchId: guarded.ctx.church!.id,
      name,
      description,
      defaultWageAmount: Number(amount),
      currency,
      payFrequency: payFrequency as any,
    })

    return NextResponse.json(level, { status: 201 })
  } catch (error: any) {
    console.error('StaffLevels.POST', error)
    return NextResponse.json({ error: error.message || 'Failed to create staff level' }, { status: 500 })
  }
}
