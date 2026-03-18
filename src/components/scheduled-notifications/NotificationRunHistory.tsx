/**
 * Notification Run History
 * Shows execution history of scheduled notifications
 */

'use client'

import React, { useState } from 'react'
import { CheckCircle2, AlertCircle, Clock, Mail } from 'lucide-react'
import { useScheduledNotificationRuns } from '@/hooks/useScheduledNotifications'
import { ScheduledNotificationRun } from '@/lib/scheduled-notifications/types'

interface NotificationRunHistoryProps {
  notificationId: string
}

export default function NotificationRunHistory({ notificationId }: NotificationRunHistoryProps) {
  const { runs, isLoading } = useScheduledNotificationRuns(notificationId)
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading execution history...</p>
        </div>
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusIcon = (status: string) => {
    if (status === 'sent') return <CheckCircle2 className="w-5 h-5 text-green-600" />
    if (status === 'failed') return <AlertCircle className="w-5 h-5 text-red-600" />
    return <Clock className="w-5 h-5 text-yellow-600" />
  }

  const getStatusColor = (status: string) => {
    if (status === 'sent')
      return 'bg-green-50 border-green-200 text-green-800'
    if (status === 'failed')
      return 'bg-red-50 border-red-200 text-red-800'
    return 'bg-yellow-50 border-yellow-200 text-yellow-800'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Mail className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Execution History ({runs.length} total)
        </h3>
      </div>

      {runs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No executions yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Digests will appear here once the schedule starts
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <div
              key={run.id}
              className={`border-2 rounded-lg p-4 transition ${getStatusColor(run.status)}`}
            >
              <button
                onClick={() =>
                  setExpandedRunId(expandedRunId === run.id ? null : run.id)
                }
                className="w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(run.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {formatDate(run.runDate)}
                        </h4>
                        <span className="text-sm font-medium capitalize">
                          {run.status}
                        </span>
                      </div>
                      <p className="text-sm opacity-75 mt-1">
                        Sent to {run.sentTo.length} recipient(s)
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 transition transform ${
                      expandedRunId === run.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded Details */}
              {expandedRunId === run.id && (
                <div className="mt-4 pt-4 border-t border-current border-opacity-20 space-y-3">
                  {/* Recipients */}
                  <div>
                    <h5 className="font-medium text-sm mb-2">Recipients:</h5>
                    <div className="space-y-1">
                      {run.sentTo.map((email) => (
                        <div
                          key={email}
                          className="text-sm opacity-75 flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {email}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Failed Recipients */}
                  {run.failedRecipients && run.failedRecipients.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm mb-2">Failed:</h5>
                      <div className="space-y-1">
                        {run.failedRecipients.map((email) => (
                          <div
                            key={email}
                            className="text-sm opacity-75 flex items-center gap-2"
                          >
                            <AlertCircle className="w-3 h-3" />
                            {email}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {run.errorMessage && (
                    <div>
                      <h5 className="font-medium text-sm mb-2">Error:</h5>
                      <p className="text-sm opacity-75 font-mono bg-black bg-opacity-10 p-2 rounded">
                        {run.errorMessage}
                      </p>
                    </div>
                  )}

                  {/* Timing */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="opacity-75">Created:</span>
                      <p className="font-medium">{formatDate(run.createdAt)}</p>
                    </div>
                    {run.completedAt && (
                      <div>
                        <span className="opacity-75">Completed:</span>
                        <p className="font-medium">{formatDate(run.completedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
