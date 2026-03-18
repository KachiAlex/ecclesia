'use client'

import React, { useState } from 'react'
import { useNotificationPreferences } from '@/hooks/useNotifications'

export interface NotificationPreferencesModalProps {
  userId: string
  onClose: () => void
  isOpen: boolean
}

/**
 * NotificationPreferencesModal Component
 * Configure notification settings
 */
export default function NotificationPreferencesModal({
  userId,
  onClose,
  isOpen,
}: NotificationPreferencesModalProps) {
  const { preferences, isLoading, updatePreferences, isUpdating } = useNotificationPreferences(userId)
  const [localPrefs, setLocalPrefs] = useState(preferences)

  const handleSave = async () => {
    await updatePreferences(localPrefs)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                disabled={isUpdating}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin text-2xl">⟳</div>
              </div>
            ) : (
              <>
                {/* Notification Channels */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Notification Channels</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
                      { key: 'inApp', label: 'In-App Notifications', description: 'See notifications in the app' },
                      { key: 'push', label: 'Push Notifications', description: 'Browser push notifications' },
                    ].map((channel) => (
                      <label key={channel.key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localPrefs?.channels?.[channel.key] || false}
                          onChange={(e) =>
                            setLocalPrefs({
                              ...localPrefs,
                              channels: {
                                ...localPrefs?.channels,
                                [channel.key]: e.target.checked,
                              },
                            })
                          }
                          className="mt-1 w-4 h-4 rounded border-gray-300"
                          disabled={isUpdating}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{channel.label}</div>
                          <div className="text-sm text-gray-600">{channel.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notification Types */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Notification Types</h3>
                  <div className="space-y-3">
                    {[
                      {
                        key: 'exportNotifications',
                        label: 'Export Notifications',
                        description: 'When your exports complete',
                      },
                      {
                        key: 'thresholdAlerts',
                        label: 'Threshold Alerts',
                        description: 'When metrics trigger your alert rules',
                      },
                      {
                        key: 'systemNotifications',
                        label: 'System Notifications',
                        description: 'Important system updates and alerts',
                      },
                    ].map((type) => (
                      <label key={type.key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localPrefs?.[type.key] || false}
                          onChange={(e) =>
                            setLocalPrefs({
                              ...localPrefs,
                              [type.key]: e.target.checked,
                            })
                          }
                          className="mt-1 w-4 h-4 rounded border-gray-300"
                          disabled={isUpdating}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{type.label}</div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Email Digest */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Email Digest Frequency</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'never', label: 'Never' },
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          localPrefs?.emailDigestFrequency === option.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="emailDigest"
                          value={option.value}
                          checked={localPrefs?.emailDigestFrequency === option.value}
                          onChange={(e) =>
                            setLocalPrefs({
                              ...localPrefs,
                              emailDigestFrequency: e.target.value,
                            })
                          }
                          className="w-4 h-4"
                          disabled={isUpdating}
                        />
                        <span className="ml-2 font-medium text-gray-900">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Quiet Hours */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Quiet Hours</h3>
                  <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={localPrefs?.quietHours?.enabled || false}
                      onChange={(e) =>
                        setLocalPrefs({
                          ...localPrefs,
                          quietHours: {
                            ...localPrefs?.quietHours,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="mt-1 w-4 h-4 rounded border-gray-300"
                      disabled={isUpdating}
                    />
                    <div>
                      <div className="font-medium text-gray-900">Enable Quiet Hours</div>
                      <div className="text-sm text-gray-600">No in-app notifications during these hours</div>
                    </div>
                  </label>

                  {localPrefs?.quietHours?.enabled && (
                    <div className="grid grid-cols-2 gap-4 pl-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                        <input
                          type="time"
                          value={localPrefs?.quietHours?.startTime || '22:00'}
                          onChange={(e) =>
                            setLocalPrefs({
                              ...localPrefs,
                              quietHours: {
                                ...localPrefs?.quietHours,
                                startTime: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={isUpdating}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                        <input
                          type="time"
                          value={localPrefs?.quietHours?.endTime || '08:00'}
                          onChange={(e) =>
                            setLocalPrefs({
                              ...localPrefs,
                              quietHours: {
                                ...localPrefs?.quietHours,
                                endTime: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={isUpdating}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isUpdating || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <span className="inline-block animate-spin">⟳</span>
                  Saving...
                </>
              ) : (
                '💾 Save Preferences'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
