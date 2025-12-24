
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import PDFDocument from 'pdfkit'

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

  const data = await res.json()
  const { items, totals } = data

  const incomeItems = (items as any[]).filter((x) => x.kind === 'income')
  const expenseItems = (items as any[]).filter((x) => x.kind === 'expense')

  const doc = new PDFDocument({ margin: 40 })
  const chunks: Buffer[] = []

  doc.on('data', (c: Buffer) => chunks.push(c))

  doc.fontSize(18).text('Accounting Balance Sheet', { align: 'left' })
  doc.moveDown(0.5)
  doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`)
  doc.moveDown(0.5)
  doc.fontSize(12).text(`Income: ${totals?.income ?? 0}    Expenses: ${totals?.expenses ?? 0}    Net: ${totals?.net ?? 0}`)
  doc.moveDown(1)

  const pageWidth = doc.page.width
  const leftX = doc.page.margins.left
  const rightX = pageWidth / 2 + 10
  const colWidth = pageWidth / 2 - doc.page.margins.left - 20

  doc.fontSize(11).text('Income', leftX, doc.y, { width: colWidth })
  doc.fontSize(11).text('Expenses', rightX, doc.y, { width: colWidth })
  doc.moveDown(0.4)
  const startY = doc.y

  doc.fontSize(9)
  const maxRows = 45
  const rows = Math.max(incomeItems.length, expenseItems.length)
  const sliceRows = Math.min(rows, maxRows)

  let y = startY
  for (let i = 0; i < sliceRows; i++) {
    const inc = incomeItems[i]
    const exp = expenseItems[i]

    const incLine = inc ? `${inc.date.slice(0, 10)}  ${inc.title}  +${inc.amount} ${inc.currency || ''}` : ''
    const expLine = exp ? `${exp.date.slice(0, 10)}  ${exp.title}  -${exp.amount} ${exp.currency || ''}` : ''

    doc.text(incLine, leftX, y, { width: colWidth })
    doc.text(expLine, rightX, y, { width: colWidth })
    y += 14
  }

  if (rows > maxRows) {
    doc.moveDown(0.5)
    doc.text(`... truncated to first ${maxRows} rows per side`)
  }

  doc.end()

  await new Promise<void>((resolve) => doc.on('end', resolve))

  const pdf = Buffer.concat(chunks)
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'attachment; filename="accounting-balance-sheet.pdf"',
    },
  })
}
