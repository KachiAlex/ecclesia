import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import { requireRole } from '@/lib/auth'
import { PayrollPeriodService, PayrollRecordService } from '@/lib/services/payroll-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let periods = await PayrollPeriodService.findByChurch(church.id)

    // Filter by status if provided
    if (status) {
      periods = periods.filter(p => p.status === status)
    }

    // Add record counts
    const periodsWithCounts = await Promise.all(
      periods.map(async (period) => {
        const recordsCount = await db.collection(COLLECTIONS.payrollRecords)
          .where('periodId', '==', period.id)
          .count()
          .get()

        return {
          ...period,
          _count: {
            records: recordsCount.data().count || 0,
          },
        }
      })
    )

    return NextResponse.json(periodsWithCounts.slice(0, 50))
  } catch (error) {
    console.error('Error fetching payroll periods:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'SUPER_ADMIN', 'PASTOR'])
    const userId = (session.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { periodName, startDate, endDate, payDate, generateRecords } = body

    if (!periodName || !startDate || !endDate || !payDate) {
      return NextResponse.json(
        { error: 'Period name, start date, end date, and pay date are required' },
        { status: 400 }
      )
    }

    const period = await PayrollPeriodService.create({
      churchId: church.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'PENDING',
    })

    // Generate payroll records if requested (simplified - would need full implementation)
    if (generateRecords) {
      // TODO: Implement generatePayrollRecords for Firestore
      console.log('Payroll record generation not yet implemented for Firestore')
    }

    // Get record count
    const recordsCount = await db.collection(COLLECTIONS.payrollRecords)
      .where('periodId', '==', period.id)
      .count()
      .get()

    return NextResponse.json({
      ...period,
      _count: {
        records: recordsCount.data().count || 0,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating payroll period:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    )
  }
}

