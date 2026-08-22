'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface PayPeriod {
  id: string
  periodName: string
  startDate: string
  endDate: string
  status: string
  _count: {
    records: number
  }
}

export default function PayPeriodDetail({ periodId }: { periodId: string }) {
  const [period, setPeriod] = useState<PayPeriod | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const loadPeriod = useCallback(async () => {
    try {
      const response = await fetch(`/api/payroll/periods?status=`)
      if (response.ok) {
        const data = await response.json()
        const found = data.find((p: PayPeriod) => p.id === periodId)
        setPeriod(found || null)
      } else {
        console.error('Failed to load pay period')
      }
    } catch (error) {
      console.error('Error loading pay period:', error)
    } finally {
      setLoading(false)
    }
  }, [periodId])

  useEffect(() => {
    loadPeriod()
  }, [loadPeriod])

  const handleGenerateRecords = async () => {
    if (!confirm('Generate payroll records for all active salaries in this period?')) {
      return
    }

    setGenerating(true)
    try {
      const response = await fetch(`/api/payroll/periods/${periodId}/generate`, {
        method: 'POST',
      })

      if (response.ok) {
        await loadPeriod()
        alert('Payroll records generated successfully')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to generate records')
      }
    } catch (error) {
      console.error('Error generating records:', error)
      alert('Failed to generate records')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading pay period...</div>
      </div>
    )
  }

  if (!period) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Pay period not found</div>
        <Link href="/dashboard/payroll" className="mt-4 inline-block text-primary-600 hover:underline">
          ← Back to Payroll Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/payroll"
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Payroll Dashboard
        </Link>
        <h1 className="text-3xl font-bold">{period.periodName}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Period Details</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Start Date:</span>
              <span className="ml-2 font-medium">
                {new Date(period.startDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">End Date:</span>
              <span className="ml-2 font-medium">
                {new Date(period.endDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-medium">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    period.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : period.status === 'PROCESSING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {period.status}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Records</h2>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {period._count.records}
          </div>
          <p className="text-sm text-gray-600">Payroll records</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Actions</h2>
        </div>
        <div className="flex gap-4">
          {period.status === 'PENDING' && period._count.records === 0 && (
            <button
              onClick={handleGenerateRecords}
              disabled={generating}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Payroll Records'}
            </button>
          )}
          <Link
            href={`/dashboard/payroll/records?periodId=${periodId}`}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            View Records
          </Link>
        </div>
      </div>
    </div>
  )
}

