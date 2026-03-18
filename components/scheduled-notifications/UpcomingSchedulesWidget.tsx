'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * UpcomingSchedulesWidget
 * Displays upcoming scheduled notifications and events
 */
export function UpcomingSchedulesWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Schedules</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          No upcoming schedules to display
        </div>
      </CardContent>
    </Card>
  )
}
