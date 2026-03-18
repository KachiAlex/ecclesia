/**
 * Scheduled Notifications Manager
 * Main interface for creating and managing scheduled recommendation digests
 */

'use client'

import React, { useState } from 'react'
import { Plus, Edit2, Trash2, PlayCircle, Clock, Mail } from 'lucide-react'
import { useScheduledNotifications, useTriggerScheduledNotification } from '@/hooks/useScheduledNotifications'
import { ScheduledNotification, ScheduledNotificationCreateInput, DigestFormat } from '@/lib/scheduled-notifications/types'
import ScheduleConfigForm from './ScheduleConfigForm'
import DigestConfigForm from './DigestConfigForm'
import NotificationRunHistory from './NotificationRunHistory'

export default function ScheduledNotificationsManager() {
  const { notifications, isLoading, createNotification, deleteNotification, updateNotification } =
    useScheduledNotifications()
  const triggerMutation = useTriggerScheduledNotification()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<ScheduledNotification | null>(null)
  const [showRunHistory, setShowRunHistory] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'edit' | 'runs'>('list')

  const handleCreate = async (input: ScheduledNotificationCreateInput) => {
    try {
      await createNotification(input)
      setShowCreateForm(false)
      // Toast notification could go here
    } catch (error) {
      console.error('Failed to create notification:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this scheduled notification?')) {
      try {
        await deleteNotification(id)
      } catch (error) {
        console.error('Failed to delete notification:', error)
      }
    }
  }

  const handleTrigger = async (id: string) => {
    try {
      await triggerMutation.mutateAsync(id)
      // Toast notification could go here
    } catch (error) {
      console.error('Failed to trigger notification:', error)
    }
  }

  const handleSelectNotification = (notification: ScheduledNotification) => {
    setSelectedNotification(notification)
    setActiveTab('edit')
    setShowCreateForm(false)
  }

  const formatNextRun = (date?: Date) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleString()
  }

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      once: '🔔 Once',
      daily: '📅 Daily',
      weekly: '📆 Weekly',
      monthly: '📊 Monthly',
    }
    return labels[frequency] || frequency
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Scheduled Digests</h2>
          <p className="text-sm text-gray-600 mt-1">Automatically send recommendation digests to your team</p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true)
            setActiveTab('list')
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          New Digest Schedule
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-2 px-4 font-medium transition ${
            activeTab === 'list'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          All Schedules ({notifications.length})
        </button>
        {selectedNotification && (
          <>
            <button
              onClick={() => setActiveTab('edit')}
              className={`pb-2 px-4 font-medium transition ${
                activeTab === 'edit'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Edit Schedule
            </button>
            <button
              onClick={() => setActiveTab('runs')}
              className={`pb-2 px-4 font-medium transition ${
                activeTab === 'runs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Execution History
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="mt-6">
        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Schedule</h3>
            <ScheduleConfigForm
              onSubmit={async (scheduleConfig) => {
                // Will be combined with digest config
                setShowCreateForm(false)
              }}
            />
          </div>
        )}

        {/* List View */}
        {activeTab === 'list' && (
          <div className="grid gap-4">
            {notifications.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No scheduled digests yet.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium mt-2"
                >
                  Create your first one →
                </button>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            notification.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {notification.status}
                        </span>
                      </div>
                      {notification.description && (
                        <p className="text-sm text-gray-600 mb-3">{notification.description}</p>
                      )}

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{getFrequencyLabel(notification.scheduleConfig.frequency)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{notification.recipientEmails.length} recipient(s)</span>
                        </div>
                      </div>

                      {/* Next Run */}
                      {notification.nextRunDate && (
                        <p className="text-xs text-gray-500 mt-2">
                          Next run: {formatNextRun(notification.nextRunDate)}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleTrigger(notification.id)}
                        disabled={triggerMutation.isPending}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                        title="Send immediately"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSelectNotification(notification)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Edit View */}
        {activeTab === 'edit' && selectedNotification && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Schedule</h3>
              <ScheduleConfigForm
                initialConfig={selectedNotification.scheduleConfig}
                onSubmit={async (config) => {
                  await updateNotification(selectedNotification.id, { scheduleConfig: config })
                }}
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Digest Content</h3>
              <DigestConfigForm
                initialConfig={selectedNotification.digestConfig}
                onSubmit={async (config) => {
                  await updateNotification(selectedNotification.id, { digestConfig: config })
                }}
              />
            </div>
          </div>
        )}

        {/* Run History View */}
        {activeTab === 'runs' && selectedNotification && (
          <NotificationRunHistory notificationId={selectedNotification.id} />
        )}
      </div>
    </div>
  )
}
