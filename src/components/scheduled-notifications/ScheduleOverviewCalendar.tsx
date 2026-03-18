/**
 * Schedule Overview Calendar
 * Visual calendar showing upcoming scheduled digest sends
 */

'use client'

import React, { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useScheduledNotifications } from '@/hooks/useScheduledNotifications'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

interface DayData {
  date: number
  hasSchedule: boolean
  scheduleCount: number
  isCurrentMonth: boolean
  fullDate: Date
}

export default function ScheduleOverviewCalendar() {
  const { notifications } = useScheduledNotifications()
  const [currentDate, setCurrentDate] = React.useState(new Date())

  const schedulesByDate = useMemo(() => {
    const map = new Map<string, number>()

    notifications
      .filter((n) => n.status === 'active')
      .forEach((notification) => {
        // For recurring schedules, mark all occurrences this month
        if (notification.scheduleConfig.frequency === 'weekly' && notification.scheduleConfig.weeklyConfig) {
          const { days, time } = notification.scheduleConfig.weeklyConfig
          const year = currentDate.getFullYear()
          const month = currentDate.getMonth()

          // Find all dates in this month that match the weekly schedule
          for (let date = 1; date <= 31; date++) {
            try {
              const checkDate = new Date(year, month, date)
              if (checkDate.getMonth() !== month) break // End of month

              const dayIndex = checkDate.getDay()
              const dayNames = [
                'sunday',
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
              ]
              if (days.includes(dayNames[dayIndex] as any)) {
                const key = `${year}-${month}-${date}`
                map.set(key, (map.get(key) || 0) + 1)
              }
            } catch (e) {
              // Skip invalid dates
            }
          }
        } else if (
          notification.scheduleConfig.frequency === 'monthly' &&
          notification.scheduleConfig.monthlyConfig
        ) {
          const { dayOfMonth } = notification.scheduleConfig.monthlyConfig
          const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${dayOfMonth}`
          map.set(key, (map.get(key) || 0) + 1)
        }
      })

    return map
  }, [notifications, currentDate])

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const prevLastDay = new Date(year, month, 0)

    const firstDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    const daysInPrevMonth = prevLastDay.getDate()

    const days: DayData[] = []

    // Previous month's days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = daysInPrevMonth - i
      days.push({
        date,
        hasSchedule: false,
        scheduleCount: 0,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, date),
      })
    }

    // Current month's days
    for (let date = 1; date <= daysInMonth; date++) {
      const key = `${year}-${month}-${date}`
      const scheduleCount = schedulesByDate.get(key) || 0

      days.push({
        date,
        hasSchedule: scheduleCount > 0,
        scheduleCount,
        isCurrentMonth: true,
        fullDate: new Date(year, month, date),
      })
    }

    // Next month's days
    const remainingDays = 42 - days.length // 6 weeks
    for (let date = 1; date <= remainingDays; date++) {
      days.push({
        date,
        hasSchedule: false,
        scheduleCount: 0,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, date),
      })
    }

    return days
  }, [currentDate, schedulesByDate])

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const activeCount = notifications.filter((n) => n.status === 'active').length

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">Schedule Calendar</h3>
        <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {activeCount} active
        </span>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 rounded transition"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="text-center min-w-28">
          <h4 className="font-semibold text-gray-900">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h4>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 rounded transition"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => (
          <div
            key={idx}
            className={`aspect-square flex flex-col items-center justify-center rounded text-sm font-medium transition ${
              day.hasSchedule
                ? 'bg-blue-100 border-2 border-blue-600 text-blue-900'
                : day.isCurrentMonth
                  ? 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                  : 'bg-gray-50 border border-gray-100 text-gray-400'
            }`}
            title={
              day.hasSchedule
                ? `${day.scheduleCount} digest${day.scheduleCount > 1 ? 's' : ''}`
                : ''
            }
          >
            <span className="text-xs">{day.date}</span>
            {day.hasSchedule && (
              <span className="text-xs font-bold text-blue-600">●</span>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-100 border-2 border-blue-600 rounded"></div>
          <span className="text-gray-600">Has scheduled digest</span>
        </div>
      </div>

      {/* Stats */}
      {activeCount > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            📅 <strong>{activeCount}</strong> active schedule{activeCount > 1 ? 's' : ''}{' '}
            running this month
          </p>
        </div>
      )}
    </div>
  )
}
