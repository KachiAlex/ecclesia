import { SalaryService, WageScaleService, PayrollPositionService, PayrollPeriodService, PayrollRecordService } from './services/payroll-service'
import { db } from './firestore'
import { COLLECTIONS } from './firestore-collections'

/**
 * Calculate payroll for a user based on their salary and period
 */
export async function calculatePayroll(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
  hoursWorked?: number,
  commissionEarned?: number,
  bonuses: number = 0,
  allowances: number = 0,
  deductions: number = 0,
  taxes: number = 0
) {
  const salaries = await SalaryService.findByUser(userId)
  const userSalary = salaries.find(s => !s.endDate) // Active salary

  if (!userSalary) {
    throw new Error('User does not have an active salary assignment')
  }

  // Get wage scale and position
  const [wageScaleDoc, position] = await Promise.all([
    db.collection(COLLECTIONS.wageScales).doc(userSalary.wageScaleId).get(),
    PayrollPositionService.findById(userSalary.positionId),
  ])

  const wageScale = wageScaleDoc.exists ? { id: wageScaleDoc.id, ...wageScaleDoc.data()! } as any : null
  if (!wageScale || !position) {
    throw new Error('Salary configuration incomplete')
  }

  const userSalaryWithRelations = {
    ...userSalary,
    wageScale,
    position,
    type: wageScale.type || 'SALARY',
    amount: wageScale.amount || 0,
  }

  let baseAmount = 0
  let grossAmount = 0

  const salaryType = userSalaryWithRelations.type
  switch (salaryType) {
    case 'SALARY':
      // Monthly salary - calculate prorated amount if needed
      const daysInPeriod = Math.ceil(
        (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
      )
      const daysInMonth = new Date(
        periodEnd.getFullYear(),
        periodEnd.getMonth() + 1,
        0
      ).getDate()
      baseAmount = (userSalaryWithRelations.amount / daysInMonth) * daysInPeriod
      break

    case 'HOURLY':
      if (!hoursWorked) {
        throw new Error('Hours worked required for hourly workers')
      }
      baseAmount = userSalaryWithRelations.amount * hoursWorked
      break

    case 'COMMISSION':
      if (commissionEarned === undefined) {
        throw new Error('Commission earned required for commission-based workers')
      }
      baseAmount = commissionEarned
      if (wageScale.commissionRate) {
        baseAmount = commissionEarned * (wageScale.commissionRate / 100)
      }
      break

    case 'STIPEND':
      baseAmount = userSalaryWithRelations.amount
      break
  }

  // Calculate gross amount
  grossAmount = baseAmount + bonuses + allowances + (wageScale.benefits || 0)

  // Calculate net amount
  const totalDeductions = deductions + (wageScale.deductions || 0) + taxes
  const netAmount = grossAmount - totalDeductions

  return {
    baseAmount,
    grossAmount,
    netAmount,
    bonuses,
    allowances,
    deductions: totalDeductions,
    taxes,
    hoursWorked,
    commissionEarned,
  }
}

/**
 * Create a payroll period
 */
export async function createPayrollPeriod(
  churchId: string,
  periodName: string,
  startDate: Date,
  endDate: Date,
  payDate: Date
) {
  return await PayrollPeriodService.create({
    churchId,
    startDate,
    endDate,
    status: 'PENDING',
  })
}

/**
 * Generate payroll records for all active employees in a period
 */
export async function generatePayrollRecords(
  periodId: string,
  churchId: string
) {
  const periods = await PayrollPeriodService.findByChurch(churchId)
  const period = periods.find(p => p.id === periodId)

  if (!period) {
    throw new Error('Payroll period not found')
  }

  // Get all users in church
  const { UserService } = await import('./services/user-service')
  const allUsers = await UserService.findByChurch(churchId)

  const records = []

  for (const user of allUsers) {
    // Get active salary for user
    const salaries = await SalaryService.findByUser(user.id)
    const activeSalary = salaries.find(s => !s.endDate && 
      new Date(s.startDate) <= period.endDate &&
      (!s.endDate || new Date(s.endDate) >= period.startDate)
    )

    if (!activeSalary) {
      continue
    }

    // Check if record already exists
    const existingRecords = await PayrollRecordService.findByPeriod(periodId)
    const existing = existingRecords.find(r => r.userId === user.id)

    if (existing) {
      continue // Skip if already exists
    }

    // Calculate payroll
    const calculation = await calculatePayroll(
      user.id,
      period.startDate,
      period.endDate
    )

    // Create payroll record
    const record = await PayrollRecordService.create({
      periodId,
      userId: user.id,
      salaryId: activeSalary.id,
      grossAmount: calculation.grossAmount,
      deductions: calculation.deductions,
      netAmount: calculation.netAmount,
      status: 'PENDING',
    })

    records.push(record)
  }

  return records
}

/**
 * Get payroll summary for a church
 */
export async function getPayrollSummary(churchId: string, startDate?: Date, endDate?: Date) {
  // Get all periods for church
  const periods = await PayrollPeriodService.findByChurch(churchId)
  const relevantPeriods = periods.filter(p => {
    if (startDate && p.endDate < startDate) return false
    if (endDate && p.startDate > endDate) return false
    return true
  })

  // Get all records for these periods
  let allRecords: any[] = []
  for (const period of relevantPeriods) {
    const records = await PayrollRecordService.findByPeriod(period.id)
    allRecords.push(...records)
  }

  // Filter by date if needed
  if (startDate || endDate) {
    allRecords = allRecords.filter(r => {
      const createdAt = r.createdAt
      if (startDate && createdAt < startDate) return false
      if (endDate && createdAt > endDate) return false
      return true
    })
  }

  const totalRecords = allRecords.length
  const paidRecords = allRecords.filter(r => r.status === 'PAID').length
  const pendingRecords = allRecords.filter(r => r.status === 'PENDING').length
  const totalPaid = allRecords
    .filter(r => r.status === 'PAID')
    .reduce((sum, r) => sum + (r.netAmount || 0), 0)
  const totalPending = allRecords
    .filter(r => r.status === 'PENDING')
    .reduce((sum, r) => sum + (r.netAmount || 0), 0)

  return {
    totalRecords,
    paidRecords,
    pendingRecords,
    totalPaid,
    totalPending,
  }
}

