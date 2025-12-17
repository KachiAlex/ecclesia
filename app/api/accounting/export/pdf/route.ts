import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import PDFDocument from 'pdfkit'

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

  const data = await res.json()
  const { items, totals } = data

  const doc = new PDFDocument({ margin: 40 })
  const chunks: Buffer[] = []

  doc.on('data', (c: Buffer) => chunks.push(c))

  doc.fontSize(18).text('Accounting Ledger', { align: 'left' })
  doc.moveDown(0.5)
  doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`)
  doc.moveDown(0.5)
  doc.fontSize(12).text(`Income: ${totals?.income ?? 0}    Expenses: ${totals?.expenses ?? 0}    Net: ${totals?.net ?? 0}`)
  doc.moveDown(1)

  const maxRows = 60
  const slice = (items as any[]).slice(0, maxRows)

  doc.fontSize(10)
  for (const it of slice) {
    const line = `${it.date} | ${it.kind.toUpperCase()} | ${it.title} | ${it.amount} ${it.currency || ''} | ${it.branchId || ''}`
    doc.text(line)
  }

  if ((items as any[]).length > maxRows) {
    doc.moveDown(0.5)
    doc.text(`... truncated to first ${maxRows} rows`) 
  }

  doc.end()

  await new Promise<void>((resolve) => doc.on('end', resolve))

  const pdf = Buffer.concat(chunks)
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'attachment; filename="accounting-ledger.pdf"',
    },
  })
}
