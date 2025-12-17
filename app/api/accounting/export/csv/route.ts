import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'

export async function GET(request: Request) {
  const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'BRANCH_ADMIN', 'PASTOR'] })
  if (!guarded.ok) return guarded.response

  const url = new URL(request.url)
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

  const { items } = await res.json()

  const header = ['kind', 'date', 'title', 'amount', 'currency', 'branchId', 'id']
  const rows = [header.join(',')]

  for (const it of items as any[]) {
    const cols = [
      it.kind,
      it.date,
      (it.title || '').replaceAll('"', '""'),
      String(it.amount ?? ''),
      it.currency || '',
      it.branchId || '',
      it.id,
    ]
    rows.push(cols.map((c) => `"${String(c)}"`).join(','))
  }

  const csv = rows.join('\n')
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="accounting-ledger.csv"',
    },
  })
}
