'use client'

import React from 'react'
import { useOptimalSchedule } from '@/hooks/useRecommendations'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * OptimalScheduleRecommendation
 * Shows the best times to schedule events based on historical attendance
 */
export function OptimalScheduleRecommendation() {
  const { schedules, isFinding, findSchedule, isLoading } = useOptimalSchedule()

  const handleAnalyze = async () => {
    // Would fetch historical attendance data from analytics
    await findSchedule({
      historicalAttendance: [],
    })
  }

  if (isLoading || isFinding) {
    return (
      <Card className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
      </Card>
    )
  }

  if (schedules.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Find Optimal Schedule
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Analyze your historical attendance data to find the best times for events
        </p>
        <Button
          onClick={handleAnalyze}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Analyze Attendance Patterns
        </Button>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
        Recommended Event Times
      </h3>
      <div className="space-y-3">
        {schedules.slice(0, 5).map((schedule, idx) => (
          <div
            key={idx}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10"
          >
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {schedule.dayOfWeek === 'Sunday' ? '✓' : '•'} {schedule.dayOfWeek}
                  </h4>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {schedule.timeOfDay}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Average Attendance</p>
                    <p className="font-bold text-lg text-gray-900 dark:text-white">
                      {schedule.historicalData.averageAttendance}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Consistency</p>
                    <p className="font-bold text-lg text-gray-900 dark:text-white">
                      {schedule.historicalData.consistencyScore}%
                    </p>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                  Range: {schedule.historicalData.minAttendance}–{schedule.historicalData.maxAttendance}
                </div>
              </div>

              <div className="flex flex-col items-end justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  schedule.confidence === 'high'
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                }`}>
                  {schedule.confidence} Confidence
                </span>
                {idx === 0 && (
                  <span className="text-xs font-bold text-green-600 dark:text-green-400 mt-2">
                    ⭐ BEST
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
