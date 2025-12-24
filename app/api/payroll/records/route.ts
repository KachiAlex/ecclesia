
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { PayrollRecordService, PayrollPeriodService, PayrollPositionService } from '@/lib/services/payroll-service'
import { UserService } from '@/lib/services/user-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { guardApi } from '@/lib/api-guard'

export async function GET(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'PASTOR', 'SUPER_ADMIN'] })
    if (!guarded.ok) return guarded.response

    const { church } = guarded.ctx

    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId')
    const userIdParam = searchParams.get('userId')
    const status = searchParams.get('status')

    let records: any[] = []

    if (periodId) {
      records = await PayrollRecordService.findByPeriod(periodId)
    } else {
      // Get all records for church (would need to query by churchId - may need to add that field)
      // For now, get by period
      const periods = await PayrollPeriodService.findByChurch(church.id)
      for (const period of periods.slice(0, 10)) {
        const periodRecords = await PayrollRecordService.findByPeriod(period.id)
        records.push(...periodRecords)
      }
    }

    // Filter by userId and status
    if (userIdParam) {
      records = records.filter(r => r.userId === userIdParam)
    }
    if (status) {
      records = records.filter(r => r.status === status)
    }

    // Add user, period, and position info
    const recordsWithDetails = await Promise.all(
      records.slice(0, 100).map(async (record) => {
        const [user, period, position] = await Promise.all([
          UserService.findById(record.userId),
          PayrollPeriodService.findByChurch(church.id).then(periods => periods.find(p => p.id === record.periodId)),
          PayrollPositionService.findById(record.positionId || ''),
        ])

        return {
          ...record,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profileImage: user.profileImage,
          } : null,
          period: period ? {
            id: period.id,
            periodName: (period as any).periodName || '',
            payDate: period.endDate,
          } : null,
          position: position ? {
            id: position.id,
            name: position.name,
          } : null,
        }
      })
    )

    return NextResponse.json(recordsWithDetails)
  } catch (error) {
    console.error('Error fetching payroll records:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
