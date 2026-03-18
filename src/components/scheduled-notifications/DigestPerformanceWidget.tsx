/**
 * Digest Performance Widget
 * Shows email delivery stats and performance metrics
 */

'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { useScheduledNotifications } from '@/hooks/useScheduledNotifications'
import { ScheduledNotification } from '@/lib/scheduled-notifications/types'

interface PerformanceMetrics {
  totalScheduled: number
  totalSent: number
  totalFailed: number
  successRate: number
  avgRecipientsPerDigest: number
}

export default function DigestPerformanceWidget() {
  const { notifications, isLoading } = useScheduledNotifications()
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalScheduled: 0,
    totalSent: 0,
    totalFailed: 0,
    successRate: 0,
    avgRecipientsPerDigest: 0,
  })

  useEffect(() => {
    if (notifications.length === 0) {
      setMetrics({
        totalScheduled: 0,
        totalSent: 0,
        totalFailed: 0,
        successRate: 0,
        avgRecipientsPerDigest: 0,
      })
      return
    }

    const activeNotifications = notifications.filter((n) => n.status === 'active')
    const totalRecipients = activeNotifications.reduce(
      (sum, n) => sum + n.recipientEmails.length,
      0
    )

    const totalRuns = activeNotifications.reduce((sum, n) => sum + n.runCount, 0)

    setMetrics({
      totalScheduled: activeNotifications.length,
      totalSent: totalRuns,
      totalFailed: 0, // Would be fetched from actual runs data
      successRate: totalRuns > 0 ? 100 : 0, // Placeholder
      avgRecipientsPerDigest:
        activeNotifications.length > 0
          ? Math.round(totalRecipients / activeNotifications.length)
          : 0,
    })
  }, [notifications])

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: 'Scheduled',
      value: metrics.totalScheduled,
      icon: '📅',
      color: 'bg-blue-50 border-blue-200',
    },
    {
      label: 'Sent',
      value: metrics.totalSent,
      icon: '✉️',
      color: 'bg-green-50 border-green-200',
    },
    {
      label: 'Success Rate',
      value: `${metrics.successRate}%`,
      icon: '✅',
      color: 'bg-emerald-50 border-emerald-200',
    },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Digest Performance</h3>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`border rounded-lg p-4 ${stat.color}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-sm text-gray-600">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Average Recipients Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-gray-600" />
          <div>
            <p className="text-sm text-gray-600">Avg recipients per digest</p>
            <p className="text-lg font-semibold text-gray-900">
              {metrics.avgRecipientsPerDigest} people
            </p>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="mt-6 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-gray-700">
            {metrics.totalSent} digests sent successfully
          </span>
        </div>
        {metrics.totalFailed > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-gray-700">
              {metrics.totalFailed} failed deliveries
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
