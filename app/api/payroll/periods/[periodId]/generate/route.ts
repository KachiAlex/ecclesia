import { NextResponse } from 'next/server'
import { generatePayrollRecords } from '@/lib/payroll'
import { guardApi } from '@/lib/api-guard'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ periodId: string }> }
) {
  try {
    const { periodId } = await params
    const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'PASTOR', 'SUPER_ADMIN'] })
    if (!guarded.ok) return guarded.response

    const { church } = guarded.ctx

    const records = await generatePayrollRecords(periodId, church.id)

    return NextResponse.json({
      success: true,
      recordsGenerated: records.length,
      records,
    })
  } catch (error: any) {
    console.error('Error generating payroll records:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    )
  }
}

