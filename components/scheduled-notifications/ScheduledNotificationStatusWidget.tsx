'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * ScheduledNotificationStatusWidget
 * Shows status and health of scheduled notifications
 */
export function ScheduledNotificationStatusWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Notification delivery status
        </div>
      </CardContent>
    </Card>
  )
}
