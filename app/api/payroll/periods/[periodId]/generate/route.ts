import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import { requireRole } from '@/lib/auth'
import { generatePayrollRecords } from '@/lib/payroll'

export async function POST(
  request: Request,
  { params }: { params: { periodId: string } }
) {
  try {
    const session = await requireRole(['ADMIN', 'SUPER_ADMIN', 'PASTOR'])
    const { periodId } = params
    const userId = (session.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

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

