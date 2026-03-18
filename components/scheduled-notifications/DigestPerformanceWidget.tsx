'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * DigestPerformanceWidget
 * Shows performance metrics for digest notifications
 */
export function DigestPerformanceWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Digest Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Digest metrics will appear here
        </div>
      </CardContent>
    </Card>
  )
}
