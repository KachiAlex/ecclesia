/**
 * Digest Configuration Form
 * Allows users to configure what content should be included in email digests
 */

'use client'

import React, { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { EmailDigestConfig, DigestFormat } from '@/lib/scheduled-notifications/types'

interface DigestConfigFormProps {
  initialConfig?: EmailDigestConfig
  onSubmit: (config: EmailDigestConfig) => Promise<void>
}

interface ContentOption {
  key: keyof EmailDigestConfig
  label: string
  description: string
  icon: string
}

const CONTENT_OPTIONS: ContentOption[] = [
  {
    key: 'includeAttendancePredictions',
    label: 'Attendance Predictions',
    description: 'Show predicted attendance for upcoming events',
    icon: '📊',
  },
  {
    key: 'includeOptimalSchedules',
    label: 'Optimal Schedules',
    description: 'Recommend best times to hold events',
    icon: '🕐',
  },
  {
    key: 'includeMemberEngagement',
    label: 'Member Engagement',
    description: 'Highlight at-risk members and leaders',
    icon: '👥',
  },
  {
    key: 'includeContentRecommendations',
    label: 'Content Recommendations',
    description: 'Suggest sermon topics and content ideas',
    icon: '📖',
  },
  {
    key: 'includeStats',
    label: 'Statistics',
    description: 'Include engagement metrics and trends',
    icon: '📈',
  },
]

export default function DigestConfigForm({
  initialConfig,
  onSubmit,
}: DigestConfigFormProps) {
  const [format, setFormat] = useState<DigestFormat>(initialConfig?.format || 'detailed')
  const [includeAttendancePredictions, setIncludeAttendancePredictions] = useState(
    initialConfig?.includeAttendancePredictions ?? true
  )
  const [includeOptimalSchedules, setIncludeOptimalSchedules] = useState(
    initialConfig?.includeOptimalSchedules ?? true
  )
  const [includeMemberEngagement, setIncludeMemberEngagement] = useState(
    initialConfig?.includeMemberEngagement ?? true
  )
  const [includeContentRecommendations, setIncludeContentRecommendations] = useState(
    initialConfig?.includeContentRecommendations ?? true
  )
  const [includeStats, setIncludeStats] = useState(initialConfig?.includeStats ?? true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const config = {
    includeAttendancePredictions,
    includeOptimalSchedules,
    includeMemberEngagement,
    includeContentRecommendations,
    includeStats,
  }

  const toggleOption = (key: keyof typeof config) => {
    const setters: Record<string, Function> = {
      includeAttendancePredictions: setIncludeAttendancePredictions,
      includeOptimalSchedules: setIncludeOptimalSchedules,
      includeMemberEngagement: setIncludeMemberEngagement,
      includeContentRecommendations: setIncludeContentRecommendations,
      includeStats: setIncludeStats,
    }
    const currentValue = config[key]
    setters[key](!currentValue)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const digestConfig: EmailDigestConfig = {
        format,
        ...config,
      }
      await onSubmit(digestConfig)
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeContentCount = Object.values(config).filter(Boolean).length

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Format Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Email Format
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(['compact', 'detailed', 'summary'] as DigestFormat[]).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setFormat(fmt)}
              className={`p-3 rounded-lg border-2 transition font-medium text-sm ${
                format === fmt
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {fmt === 'compact' && '📱 Compact'}
              {fmt === 'detailed' && '📄 Detailed'}
              {fmt === 'summary' && '⏱️ Summary'}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {format === 'compact' &&
            'Minimal details, quick read - best for busy schedules'}
          {format === 'detailed' && 'Full information with all metrics - comprehensive view'}
          {format === 'summary' && 'Key highlights only - focused on essentials'}
        </p>
      </div>

      {/* Content Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What to include ({activeContentCount}/5 selected)
        </label>
        <div className="space-y-2">
          {CONTENT_OPTIONS.map((option) => {
            const isSelected = config[option.key]
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => toggleOption(option.key)}
                className={`w-full p-4 rounded-lg border-2 transition text-left ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{option.icon}</span>
                      <h4 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {option.label}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 mb-2">📧 Email Preview</h4>
        <p className="text-sm text-amber-800">
          {activeContentCount === 0
            ? '⚠️ Select at least one content type'
            : `Format: ${format} • Content: ${activeContentCount} section(s)`}
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || activeContentCount === 0}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {isSubmitting ? 'Saving...' : 'Save Content Settings'}
      </button>
    </form>
  )
}
