
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UserService } from '@/lib/services/user-service'
import { AccountingIncomeService } from '@/lib/services/accounting-income-service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ incomeId: string }> }
) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'BRANCH_ADMIN', 'PASTOR'] })
    if (!guarded.ok) return guarded.response

    const { church, userId, role } = guarded.ctx
    const user = await UserService.findById(userId)

    const { incomeId } = await params
    const original = await AccountingIncomeService.findById(incomeId)

    if (!original || original.churchId !== church.id) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    const effectiveBranchId = role === 'BRANCH_ADMIN' ? ((user as any)?.branchId || null) : null
    if (role === 'BRANCH_ADMIN' && original.branchId && original.branchId !== effectiveBranchId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const reason = (body?.reason as string | undefined) || ''

    const created = await AccountingIncomeService.create({
      churchId: church.id,
      branchId: original.branchId,
      amount: -Math.abs(Number(original.amount || 0)),
      currency: original.currency,
      source: `Void: ${original.source}`,
      description: reason ? `Void entry for ${incomeId}: ${reason}` : `Void entry for ${incomeId}`,
      incomeDate: new Date(),
      createdBy: userId,
      voidsIncomeId: incomeId,
    })

    return NextResponse.json({ income: created }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
