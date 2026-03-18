/**
 * Scheduled Notification Status Widget
 * Quick status overview of all scheduled notifications
 */

'use client'

import React from 'react'
import { Activity, AlertCircle, CheckCircle2, Pause } from 'lucide-react'
import { useScheduledNotifications } from '@/hooks/useScheduledNotifications'

export default function ScheduledNotificationStatusWidget() {
  const { notifications, isLoading } = useScheduledNotifications()

  const stats = React.useMemo(() => {
    return {
      active: notifications.filter((n) => n.status === 'active').length,
      paused: notifications.filter((n) => n.status === 'paused').length,
      total: notifications.length,
      nextRun: notifications
        .filter((n) => n.status === 'active' && n.nextRunDate)
        .sort((a, b) => {
          const aDate = new Date(a.nextRunDate!).getTime()
          const bDate = new Date(b.nextRunDate!).getTime()
          return aDate - bDate
        })[0],
    }
  }, [notifications])

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-12 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  const formatTimeUntil = (date: Date) => {
    const now = new Date()
    const diff = new Date(date).getTime() - now.getTime()

    if (diff < 0) return 'Running now'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} away`
    if (hours > 0) return `${hours}h ${minutes}m away`
    return `${minutes}m away`
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Notification Status</h3>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-800">Active</span>
          </div>
          <div className="text-2xl font-bold text-green-900">{stats.active}</div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Pause className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-700">Paused</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.paused}</div>
        </div>
      </div>

      {/* Next Scheduled Send */}
      {stats.nextRun ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium mb-1">NEXT SCHEDULED SEND</p>
              <p className="text-sm font-semibold text-blue-900">{stats.nextRun.title}</p>
              <p className="text-sm text-blue-700 mt-1">
                {formatTimeUntil(stats.nextRun.nextRunDate!)}
              </p>
            </div>
            <span className="text-lg">📬</span>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-900">No active schedules</p>
              <p className="text-xs text-yellow-700 mt-1">
                Create one to start sending digests automatically
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Total Count */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{stats.total}</span>{' '}
          total schedule{stats.total !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
