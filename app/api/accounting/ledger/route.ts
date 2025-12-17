import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UserService } from '@/lib/services/user-service'
import { AccountingExpenseService } from '@/lib/services/accounting-expense-service'
import { AccountingIncomeService } from '@/lib/services/accounting-income-service'
import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

type LedgerItem = {
  kind: 'income' | 'expense'
  id: string
  branchId?: string
  currency?: string
  amount: number
  title: string
  date: string
  meta?: any
}

export async function GET(request: Request) {
  try {
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

    const startDate = start ? new Date(start) : undefined
    const endDate = end ? new Date(end) : undefined

    // NOTE: Avoid Firestore range queries here to prevent composite index/orderBy requirements.
    // We fetch by churchId/branchId only and filter by date in-memory.
    let donationsQuery: any = db.collection(COLLECTIONS.donations).where('churchId', '==', church.id)
    if (effectiveBranchId) donationsQuery = donationsQuery.where('branchId', '==', effectiveBranchId)
    donationsQuery = donationsQuery.limit(500)

    const [donationsSnap, expenses, manualIncome] = await Promise.all([
      donationsQuery.get(),
      AccountingExpenseService.findByChurch(church.id, {
        branchId: effectiveBranchId,
        startDate,
        endDate,
        limit: 500,
      }),
      AccountingIncomeService.findByChurch(church.id, {
        branchId: effectiveBranchId,
        startDate,
        endDate,
        limit: 500,
      }),
    ])

    const income: LedgerItem[] = donationsSnap.docs
      .map((doc: any) => {
        const data = doc.data()
        const createdAt = toDate(data.createdAt)
        return {
          kind: 'income',
          id: doc.id,
          branchId: data.branchId || undefined,
          currency: data.currency || undefined,
          amount: Number(data.amount || 0),
          title: data.type ? `Giving: ${data.type}` : 'Giving',
          date: createdAt.toISOString(),
          meta: {
            source: 'GIVING',
            userId: data.userId,
            projectId: data.projectId || null,
            transactionId: data.transactionId || null,
          },
        } as LedgerItem
      })
      .filter((x: LedgerItem) => {
        const d = new Date(x.date)
        if (startDate && d < startDate) return false
        if (endDate && d > endDate) return false
        return true
      })

    const manualIncomeItems: LedgerItem[] = manualIncome
      .map((m) => ({
        kind: 'income',
        id: m.id,
        branchId: m.branchId,
        currency: m.currency,
        amount: Number(m.amount || 0),
        title: `Manual: ${m.source}${m.description ? ` - ${m.description}` : ''}`,
        date: m.incomeDate.toISOString(),
        meta: {
          source: 'MANUAL',
          createdBy: m.createdBy,
          attachmentUrl: m.attachmentUrl || null,
          voidsIncomeId: (m as any).voidsIncomeId || null,
        },
      }))

    const expenseItems: LedgerItem[] = expenses.map((e) => ({
      kind: 'expense',
      id: e.id,
      branchId: e.branchId,
      currency: e.currency,
      amount: Number(e.amount || 0),
      title: `${e.category}${e.description ? ` - ${e.description}` : ''}`,
      date: e.expenseDate.toISOString(),
      meta: { createdBy: e.createdBy },
    }))

    const items = [...income, ...manualIncomeItems, ...expenseItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const totals = items.reduce(
      (acc, it) => {
        if (it.kind === 'income') acc.income += it.amount
        else acc.expenses += it.amount
        return acc
      },
      { income: 0, expenses: 0 }
    )

    return NextResponse.json({ items, totals: { ...totals, net: totals.income - totals.expenses } })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
