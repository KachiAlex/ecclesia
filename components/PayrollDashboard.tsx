'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface PayrollSummary {
  totalRecords: number
  paidRecords: number
  pendingRecords: number
  totalPaid: number
  totalPending: number
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
  const [activeTab, setActiveTab] = useState<'summary' | 'salaries' | 'periods'>('summary')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [summaryRes, salariesRes, periodsRes] = await Promise.all([
        fetch('/api/payroll/summary'),
        fetch('/api/payroll/salaries?activeOnly=true'),
        fetch('/api/payroll/periods'),
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
    } catch (error) {
      console.error('Error loading payroll data:', error)
    } finally {
      setLoading(false)
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

