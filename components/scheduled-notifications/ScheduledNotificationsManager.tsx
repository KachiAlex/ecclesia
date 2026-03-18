'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * ScheduledNotificationsManager
 * Manages scheduled notifications configuration and delivery
 */
export function ScheduledNotificationsManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Notification scheduling system
        </div>
      </CardContent>
    </Card>
  )
}
