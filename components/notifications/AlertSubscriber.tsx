'use client'

import React, { useState } from 'react'
import { useAlertRules } from '@/hooks/useNotifications'

export interface AlertSubscriberProps {
  userId: string
  churchId: string
}

type MetricType = 'meetings' | 'attendance' | 'livestream' | 'engagement' | 'members'
type AlertCondition = 'below' | 'above' | 'equals' | 'changes'

/**
 * AlertSubscriber Component
 * Create and manage alert rules
 */
export default function AlertSubscriber({ userId, churchId }: AlertSubscriberProps) {
  const { rules, isLoading, createRule, updateRule, deleteRule, toggleRule } = useAlertRules(userId, churchId)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    metric: 'meetings' as MetricType,
    condition: 'below' as AlertCondition,
    threshold: 10,
    frequency: 'realtime' as const,
    notifyVia: {
      email: true,
      inApp: true,
      push: false,
    },
  })

  const handleCreateRule = () => {
    createRule(formData)
    setFormData({
      name: '',
      metric: 'meetings',
      condition: 'below',
      threshold: 10,
      frequency: 'realtime',
      notifyVia: {
        email: true,
        inApp: true,
        push: false,
      },
    })
    setShowForm(false)
  }

  const metrics: { value: MetricType; label: string }[] = [
    { value: 'meetings', label: 'Meetings' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'livestream', label: 'Livestream' },
    { value: 'engagement', label: 'Engagement' },
    { value: 'members', label: 'Members' },
  ]

  const conditions: { value: AlertCondition; label: string }[] = [
    { value: 'below', label: 'Below' },
    { value: 'above', label: 'Above' },
    { value: 'equals', label: 'Equals' },
    { value: 'changes', label: 'Changes' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">Alert Rules</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
        >
          <span>➕</span>
          Create Alert
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alert Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Low attendance warning"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Metric</label>
              <select
                value={formData.metric}
                onChange={(e) => setFormData({ ...formData, metric: e.target.value as MetricType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {metrics.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as AlertCondition })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {conditions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Threshold Value</label>
            <input
              type="number"
              value={formData.threshold}
              onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Notify Via</label>
            <div className="space-y-2">
              {[
                { key: 'email', label: 'Email' },
                { key: 'inApp', label: 'In App' },
                { key: 'push', label: 'Push' },
              ].map((channel) => (
                <label key={channel.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.notifyVia[channel.key as keyof typeof formData.notifyVia]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifyVia: {
                          ...formData.notifyVia,
                          [channel.key]: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{channel.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCreateRule}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Alert
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin text-2xl">⟳</div>
          </div>
        ) : rules.length === 0 ? (
          <div className="p-6 text-center rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-gray-600">No alert rules created yet</p>
            <p className="text-sm text-gray-500 mt-1">Create your first alert to get started</p>
          </div>
        ) : (
          rules.map((rule: any) => (
            <div key={rule.id} className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        rule.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    When {rule.metric} is {rule.condition} {rule.threshold}
                  </p>
                  <div className="flex gap-3 mt-3 text-xs text-gray-500">
                    {rule.notifyVia.email && <span>📧 Email</span>}
                    {rule.notifyVia.inApp && <span>🔔 In-App</span>}
                    {rule.notifyVia.push && <span>📱 Push</span>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleRule(rule.id, !rule.enabled)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      rule.enabled
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="px-3 py-1 rounded text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
