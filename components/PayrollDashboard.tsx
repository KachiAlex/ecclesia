'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface PayrollSummary {
  totalRecords: number
  paidRecords: number
  pendingRecords: number
  totalPaid: number
  totalPending: number
}

type PayFrequencyOption = 'weekly' | 'biweekly' | 'monthly' | 'annual'

interface StaffLevelOption {
  id: string
  name: string
  description?: string
  defaultWageAmount: number
  currency: string
  payFrequency: PayFrequencyOption
}

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  email: string
  profileImage?: string
  staffLevelId?: string
  staffLevelName?: string
  customWage?: {
    amount: number
    currency: string
    payFrequency: PayFrequencyOption
  } | null
}

type WageSource = 'custom' | 'level' | 'missing'

interface StaffWageDetails {
  amount: number | null
  currency: string | null
  payFrequency: PayFrequencyOption | null
  source: WageSource
}

const formatPayFrequencyLabel = (frequency?: PayFrequencyOption | string | null) => {
  if (!frequency) return null
  const normalized = frequency.toLowerCase()
  return normalized === 'biweekly'
    ? 'Bi-weekly'
    : normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const formatStaffCurrency = (amount?: number | null, currency?: string | null) => {
  if (typeof amount !== 'number' || !currency) return null
  return formatCurrency(amount, currency)
}

interface Salary {
  id: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
  }
  position: {
    name: string
    department?: {
      name: string
    }
  }
  wageScale: {
    type: string
    amount: number
    currency: string
  }
  startDate: string
  isActive: boolean
}

interface PayrollPeriod {
  id: string
  periodName: string
  startDate: string
  endDate: string
  payDate: string
  status: string
  totalAmount: number
  totalEmployees: number
  _count: {
    records: number
  }
}

export default function PayrollDashboard() {
  const [summary, setSummary] = useState<PayrollSummary | null>(null)
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [periods, setPeriods] = useState<PayrollPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'summary' | 'staff' | 'salaries' | 'periods'>('summary')
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [staffLevels, setStaffLevels] = useState<StaffLevelOption[]>([])
  const [staffLoading, setStaffLoading] = useState(true)
  const [staffError, setStaffError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setStaffLoading(true)
      setStaffError('')
      const [summaryRes, salariesRes, periodsRes, staffRes, staffLevelsRes] = await Promise.all([
        fetch('/api/payroll/summary'),
        fetch('/api/payroll/salaries?activeOnly=true'),
        fetch('/api/payroll/periods'),
        fetch('/api/users?isStaff=true&limit=500'),
        fetch('/api/staff-levels'),
      ])

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json()
        setSummary(summaryData)
      }

      if (salariesRes.ok) {
        const salariesData = await salariesRes.json()
        setSalaries(salariesData)
      }

      if (periodsRes.ok) {
        const periodsData = await periodsRes.json()
        setPeriods(periodsData)
      }

      if (staffRes.ok) {
        const staffPayload = await staffRes.json()
        const staffList = Array.isArray(staffPayload?.users) ? staffPayload.users : []
        setStaffMembers(
          staffList.map((user: any) => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profileImage: user.profileImage,
            staffLevelId: user.staffLevelId,
            staffLevelName: user.staffLevelName,
            customWage: user.customWage ?? null,
          })),
        )
      } else {
        setStaffMembers([])
        setStaffError('Failed to load staff members.')
      }

      if (staffLevelsRes.ok) {
        const staffLevelData = await staffLevelsRes.json()
        setStaffLevels(Array.isArray(staffLevelData) ? staffLevelData : [])
      } else {
        setStaffLevels([])
      }
    } catch (error) {
      console.error('Error loading payroll data:', error)
      setStaffError('Unable to load staff wage information.')
    } finally {
      setLoading(false)
      setStaffLoading(false)
    }
  }

  const staffLevelMap = useMemo(() => {
    return staffLevels.reduce<Record<string, StaffLevelOption>>((acc, level) => {
      acc[level.id] = level
      return acc
    }, {})
  }, [staffLevels])

  const salaryByUserId = useMemo(() => {
    const map = new Map<string, Salary>()
    salaries.forEach((salary) => {
      if (salary.user?.id) {
        map.set(salary.user.id, salary)
      }
    })
    return map
  }, [salaries])

  const getStaffWageDetails = (member: StaffMember): StaffWageDetails => {
    if (member.customWage && typeof member.customWage.amount === 'number' && member.customWage.currency) {
      return {
        amount: member.customWage.amount,
        currency: member.customWage.currency,
        payFrequency: member.customWage.payFrequency,
        source: 'custom',
      }
    }
    if (member.staffLevelId && staffLevelMap[member.staffLevelId]) {
      const level = staffLevelMap[member.staffLevelId]
      return {
        amount: level.defaultWageAmount,
        currency: level.currency,
        payFrequency: level.payFrequency,
        source: 'level',
      }
    }
    return {
      amount: null,
      currency: null,
      payFrequency: null,
      source: 'missing',
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading payroll data...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payroll Dashboard</h1>
        <div className="flex gap-4">
          <Link
            href="/dashboard/payroll/positions"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Manage Positions
          </Link>
          <Link
            href="/dashboard/payroll/periods/new"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            New Pay Period
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-4 px-2 border-b-2 ${
              activeTab === 'summary'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`pb-4 px-2 border-b-2 ${
              activeTab === 'staff'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Staff Wages ({staffMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('salaries')}
            className={`pb-4 px-2 border-b-2 ${
              activeTab === 'salaries'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Active Salaries ({salaries.length})
          </button>
          <button
            onClick={() => setActiveTab('periods')}
            className={`pb-4 px-2 border-b-2 ${
              activeTab === 'periods'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pay Periods ({periods.length})
          </button>
        </nav>
      </div>

      {/* Staff Wages Tab */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
            <p className="text-sm text-gray-600">
              Every staff member inherits wage details from their assigned staff level unless a custom override is set.
            </p>
          </div>
          {staffLoading ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading staff wage data…</div>
          ) : staffError ? (
            <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {staffError}
            </div>
          ) : staffMembers.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              No staff members yet. Mark members as staff from the directory to see them here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Staff Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Wage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Payroll Status
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {staffMembers.map((member) => {
                    const wageDetails = getStaffWageDetails(member)
                    const wageAmountLabel = formatStaffCurrency(wageDetails.amount, wageDetails.currency)
                    const frequencyLabel = formatPayFrequencyLabel(wageDetails.payFrequency)
                    const assignedSalary = salaryByUserId.get(member.id)
                    return (
                      <tr key={member.id}>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0">
                              {member.profileImage ? (
                                <img
                                  src={member.profileImage}
                                  alt={`${member.firstName} ${member.lastName}`}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                                  {member.firstName[0]}
                                  {member.lastName[0]}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {member.firstName} {member.lastName}
                              </div>
                              <div className="text-xs text-gray-500">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {member.staffLevelName ? (
                            <div className="text-sm font-medium text-gray-900">{member.staffLevelName}</div>
                          ) : (
                            <span className="text-xs text-gray-500">No level assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {wageAmountLabel ? (
                            <div className="space-y-1">
                              <div className="text-sm font-semibold text-gray-900">{wageAmountLabel}</div>
                              {frequencyLabel && (
                                <div className="text-xs text-gray-500">{frequencyLabel} pay frequency</div>
                              )}
                              <div>
                                {wageDetails.source === 'custom' ? (
                                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                    Custom override
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                                    Staff level default
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Wage not configured</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {assignedSalary ? (
                            <div className="space-y-1 text-sm">
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                Assigned to payroll
                              </span>
                              <div className="text-xs text-gray-500">
                                {assignedSalary.position.name} ·{' '}
                                {formatCurrency(assignedSalary.wageScale.amount, assignedSalary.wageScale.currency)}
                              </div>
                              <div className="text-xs text-gray-400">
                                Since {formatDate(assignedSalary.startDate)}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              Not yet on payroll
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                          <Link href={`/users/${member.id}`} className="text-primary-600 hover:text-primary-800">
                            View profile →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && summary && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Records</div>
            <div className="text-3xl font-bold">{summary.totalRecords}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Paid</div>
            <div className="text-3xl font-bold text-green-600">
              {summary.paidRecords}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {formatCurrency(summary.totalPaid)}
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Pending</div>
            <div className="text-3xl font-bold text-yellow-600">
              {summary.pendingRecords}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {formatCurrency(summary.totalPending)}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Payroll</div>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(summary.totalPaid + summary.totalPending)}
            </div>
          </div>
        </div>
      )}

      {/* Salaries Tab */}
      {activeTab === 'salaries' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Start Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salaries.map((salary) => (
                  <tr key={salary.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {salary.user.profileImage ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={salary.user.profileImage}
                              alt={`${salary.user.firstName} ${salary.user.lastName}`}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-medium">
                                {salary.user.firstName[0]}{salary.user.lastName[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {salary.user.firstName} {salary.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {salary.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {salary.position.name}
                      </div>
                      {salary.position.department && (
                        <div className="text-sm text-gray-500">
                          {salary.position.department.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {salary.wageScale.type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {salary.wageScale.currency} {salary.wageScale.amount.toLocaleString()}
                      {salary.wageScale.type === 'HOURLY' && '/hour'}
                      {salary.wageScale.type === 'SALARY' && '/month'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(salary.startDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Periods Tab */}
      {activeTab === 'periods' && (
        <div className="space-y-4">
          {periods.map((period) => (
            <div
              key={period.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{period.periodName}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(period.startDate)} - {formatDate(period.endDate)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Pay Date: {formatDate(period.payDate)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      period.status === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : period.status === 'APPROVED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {period.status}
                  </span>
                  <div className="mt-2">
                    <div className="text-lg font-bold">
                      {formatCurrency(period.totalAmount)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {period.totalEmployees} employees
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href={`/dashboard/payroll/periods/${period.id}`}
                  className="text-primary-600 hover:underline text-sm"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

