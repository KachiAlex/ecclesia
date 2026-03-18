/**
 * Schedule Configuration Form
 * Allows users to configure when digests should be sent
 */

'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ScheduleConfig, ScheduleFrequency, DayOfWeek } from '@/lib/scheduled-notifications/types'

interface ScheduleConfigFormProps {
  initialConfig?: ScheduleConfig
  onSubmit: (config: ScheduleConfig) => Promise<void>
}

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

export default function ScheduleConfigForm({ initialConfig, onSubmit }: ScheduleConfigFormProps) {
  const [frequency, setFrequency] = useState<ScheduleFrequency>(
    initialConfig?.frequency || 'weekly'
  )
  const [hour, setHour] = useState(initialConfig?.time?.hour || 9)
  const [minute, setMinute] = useState(initialConfig?.time?.minute || 0)
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(
    initialConfig?.weeklyConfig?.days || ['monday', 'wednesday', 'friday']
  )
  const [monthlyDay, setMonthlyDay] = useState(
    initialConfig?.monthlyConfig?.dayOfMonth || 1
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleToggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const config: ScheduleConfig = {
        frequency,
        time: { hour, minute },
        weeklyConfig:
          frequency === 'weekly'
            ? { days: selectedDays, time: { hour, minute } }
            : undefined,
        monthlyConfig:
          frequency === 'monthly'
            ? { dayOfMonth: monthlyDay, time: { hour, minute } }
            : undefined,
      }

      await onSubmit(config)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Frequency Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How often should digests be sent?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['once', 'daily', 'weekly', 'monthly'] as ScheduleFrequency[]).map((freq) => (
            <button
              key={freq}
              type="button"
              onClick={() => setFrequency(freq)}
              className={`p-3 rounded-lg border-2 transition font-medium ${
                frequency === freq
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {freq.charAt(0).toUpperCase() + freq.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Time Selection */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What time should the digest be sent?
        </label>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Hour</label>
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Minute</label>
            <select
              value={minute}
              onChange={(e) => setMinute(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[0, 15, 30, 45].map((m) => (
                <option key={m} value={m}>
                  :{String(m).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Weekly Configuration */}
      {frequency === 'weekly' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Which days should the digest be sent?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => handleToggleDay(day.value)}
                className={`p-2 rounded border transition text-sm font-medium ${
                  selectedDays.includes(day.value)
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Configuration */}
      {frequency === 'monthly' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Which day of the month?
          </label>
          <select
            value={monthlyDay}
            onChange={(e) => setMonthlyDay(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                Day {day} of each month
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-600 mt-2">
            Limited to day 28 to work with all months (Feb uses day 28)
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Schedule:</strong> Digests will be sent{' '}
          <span className="font-medium">
            {frequency === 'weekly'
              ? `every ${selectedDays.join(', ')}`
              : frequency === 'monthly'
                ? `on day ${monthlyDay}`
                : 'daily'}{' '}
            at {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
          </span>
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || (frequency === 'weekly' && selectedDays.length === 0)}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {isSubmitting ? 'Saving...' : 'Save Schedule'}
      </button>
    </form>
  )
}
