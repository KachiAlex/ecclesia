'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * ScheduleOverviewCalendar
 * Calendar view of scheduled notifications
 */
export function ScheduleOverviewCalendar() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Calendar view of scheduled notifications
        </div>
      </CardContent>
    </Card>
  )
}
