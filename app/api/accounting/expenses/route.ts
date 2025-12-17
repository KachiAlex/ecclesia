import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UserService } from '@/lib/services/user-service'
import { AccountingExpenseService } from '@/lib/services/accounting-expense-service'

export async function GET(request: Request) {
  const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'BRANCH_ADMIN', 'PASTOR'] })
  if (!guarded.ok) return guarded.response

  const { church, userId, role } = guarded.ctx
  const user = await UserService.findById(userId)

  const { searchParams } = new URL(request.url)
  const branchIdParam = searchParams.get('branchId')
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  const effectiveBranchId = role === 'BRANCH_ADMIN' ? ((user as any)?.branchId || null) : (branchIdParam || null)
  if (role === 'BRANCH_ADMIN' && branchIdParam && branchIdParam !== effectiveBranchId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const expenses = await AccountingExpenseService.findByChurch(church.id, {
    branchId: effectiveBranchId,
    startDate: start ? new Date(start) : undefined,
    endDate: end ? new Date(end) : undefined,
    limit: 500,
  })

  return NextResponse.json({ expenses })
}

export async function POST(request: Request) {
  const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'BRANCH_ADMIN', 'PASTOR'] })
  if (!guarded.ok) return guarded.response

  const { church, userId, role } = guarded.ctx
  const user = await UserService.findById(userId)

  const body = await request.json()
  const { branchId, amount, currency, category, description, expenseDate } = body

  if (!amount || !category || !expenseDate) {
    return NextResponse.json({ error: 'amount, category and expenseDate are required' }, { status: 400 })
  }

  const effectiveBranchId = role === 'BRANCH_ADMIN' ? ((user as any)?.branchId || null) : (branchId || null)
  if (role === 'BRANCH_ADMIN' && branchId && branchId !== effectiveBranchId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const created = await AccountingExpenseService.create({
    churchId: church.id,
    branchId: effectiveBranchId || undefined,
    amount: Number(amount),
    currency: currency || undefined,
    category,
    description: description || undefined,
    expenseDate: new Date(expenseDate),
    createdBy: userId,
  })

  return NextResponse.json({ expense: created }, { status: 201 })
}
