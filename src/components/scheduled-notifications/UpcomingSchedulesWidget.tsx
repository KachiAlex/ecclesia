/**
 * Upcoming Schedules Widget
 * Shows next scheduled digest sends with countdown timers
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Mail, ChevronRight } from 'lucide-react'
import { useScheduledNotifications } from '@/hooks/useScheduledNotifications'
import { ScheduledNotification } from '@/lib/scheduled-notifications/types'

interface UpcomingScheduleItem {
  notification: ScheduledNotification
  hoursUntil: number
  minutesUntil: number
  isToday: boolean
}

export default function UpcomingSchedulesWidget() {
  const { notifications, isLoading } = useScheduledNotifications()
  const [upcomingSchedules, setUpcomingSchedules] = useState<UpcomingScheduleItem[]>([])

  useEffect(() => {
    // Calculate upcoming schedules
    const upcoming: UpcomingScheduleItem[] = notifications
      .filter((n) => n.status === 'active' && n.nextRunDate)
      .map((notification) => {
        const now = new Date()
        const nextRun = new Date(notification.nextRunDate!)
        const diff = nextRun.getTime() - now.getTime()

        const hoursUntil = Math.floor(diff / (1000 * 60 * 60))
        const minutesUntil = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

        const isToday =
          nextRun.toDateString() === now.toDateString()

        return {
          notification,
          hoursUntil: Math.max(0, hoursUntil),
          minutesUntil: Math.max(0, minutesUntil),
          isToday,
        }
      })
      .sort((a, b) => {
        const aTime = (a.hoursUntil * 60 + a.minutesUntil)
        const bTime = (b.hoursUntil * 60 + b.minutesUntil)
        return aTime - bTime
      })
      .slice(0, 5) // Show top 5 upcoming

    setUpcomingSchedules(upcoming)
  }, [notifications])

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Upcoming Digests</h3>
        </div>
        <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {notifications.filter((n) => n.status === 'active').length} active
        </span>
      </div>

      {upcomingSchedules.length === 0 ? (
        <div className="text-center py-8">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No active schedules</p>
        </div>
      ) : (
        <div className="space-y-2">
          {upcomingSchedules.map((item, idx) => (
            <div
              key={item.notification.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {item.notification.title}
                  </h4>
                  {item.isToday && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {item.notification.recipientEmails.length} recipient(s)
                </p>
              </div>

              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {item.hoursUntil > 0
                    ? `${item.hoursUntil}h ${item.minutesUntil}m`
                    : `${item.minutesUntil}m`}
                </div>
                <p className="text-xs text-gray-500">until send</p>
              </div>

              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 ml-2" />
            </div>
          ))}
        </div>
      )}

      {upcomingSchedules.length > 0 && (
        <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium">
          View all schedules →
        </button>
      )}
    </div>
  )
}
