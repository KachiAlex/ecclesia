
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'

export async function GET(request: Request) {
  const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'BRANCH_ADMIN', 'PASTOR'] })
  if (!guarded.ok) return guarded.response

  const url = new URL(request.url)
  const branchId = url.searchParams.get('branchId')
  if (!branchId) {
    return NextResponse.json({ error: 'branchId is required for balance sheet export' }, { status: 400 })
  }
  const ledgerUrl = new URL('/api/accounting/ledger', url.origin)
  ledgerUrl.search = url.search

  const res = await fetch(ledgerUrl.toString(), {
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: text || 'Failed to export' }, { status: 500 })
  }

  const { items, totals } = await res.json()

  const incomeItems = (items as any[]).filter((x) => x.kind === 'income')
  const expenseItems = (items as any[]).filter((x) => x.kind === 'expense')
  const maxRows = Math.max(incomeItems.length, expenseItems.length)

  const header = [
    'income_date',
    'income_title',
    'income_amount',
    'income_currency',
    'expense_date',
    'expense_title',
    'expense_amount',
    'expense_currency',
  ]
  const rows: string[] = [header.join(',')]

  for (let i = 0; i < maxRows; i++) {
    const inc = incomeItems[i]
    const exp = expenseItems[i]

    const cols = [
      inc ? inc.date : '',
      inc ? (inc.title || '').replaceAll('"', '""') : '',
      inc ? String(inc.amount ?? '') : '',
      inc ? (inc.currency || '') : '',
      exp ? exp.date : '',
      exp ? (exp.title || '').replaceAll('"', '""') : '',
      exp ? String(exp.amount ?? '') : '',
      exp ? (exp.currency || '') : '',
    ]
    rows.push(cols.map((c) => `"${String(c)}"`).join(','))
  }

  rows.push('')
  rows.push(`"TOTAL INCOME","${totals?.income ?? 0}","TOTAL EXPENSES","${totals?.expenses ?? 0}","NET","${totals?.net ?? 0}"`)

  const csv = rows.join('\n')
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="accounting-balance-sheet.csv"',
    },
  })
}
