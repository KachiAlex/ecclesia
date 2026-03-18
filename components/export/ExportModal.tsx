'use client'

import React, { useState } from 'react'

interface DateRange {
  startDate: Date
  endDate: Date
}

export interface ExportModalProps {
  metric: string
  isOpen: boolean
  isLoading: boolean
  error: string | null
  onClose: () => void
  onExport: () => void
  selectedFormat: 'pdf' | 'csv' | 'json'
  onFormatChange: (format: 'pdf' | 'csv' | 'json') => void
  dateRange: DateRange
  onDateRangeChange: (startDate: Date | string, endDate: Date | string) => void
  onLast7Days: () => void
  onLast30Days: () => void
  onLast90Days: () => void
  onThisMonth: () => void
  onLastMonth: () => void
}

/**
 * ExportModal Component
 * Modal for selecting export format, date range, and options
 */
export default function ExportModal({
  metric,
  isOpen,
  isLoading,
  error,
  onClose,
  onExport,
  selectedFormat,
  onFormatChange,
  dateRange,
  onDateRangeChange,
  onLast7Days,
  onLast30Days,
  onLast90Days,
  onThisMonth,
  onLastMonth,
}: ExportModalProps) {
  const [customStartDate, setCustomStartDate] = useState(dateRange.startDate.toISOString().split('T')[0])
  const [customEndDate, setCustomEndDate] = useState(dateRange.endDate.toISOString().split('T')[0])

  if (!isOpen) return null

  const formats = [
    {
      id: 'pdf',
      label: 'PDF Document',
      description: 'Professional report with charts and metrics',
      icon: '📄',
    },
    {
      id: 'csv',
      label: 'CSV Spreadsheet',
      description: 'Compatible with Excel and Google Sheets',
      icon: '📊',
    },
    {
      id: 'json',
      label: 'JSON Data',
      description: 'Structured data for APIs and integrations',
      icon: '{ }',
    },
  ]

  const handleCustomDateChange = () => {
    try {
      const start = new Date(customStartDate)
      const end = new Date(customEndDate)
      if (start < end) {
        onDateRangeChange(start, end)
      }
    } catch (error) {
      console.error('Invalid date:', error)
    }
  }

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Export {metric.toUpperCase()} Data</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                disabled={isLoading}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                <div className="font-semibold">Export Error</div>
                <div>{error}</div>
              </div>
            )}

            {/* Format Selection */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Export Format</h3>
              <div className="grid grid-cols-1 gap-3">
                {formats.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => onFormatChange(format.id as any)}
                    className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                      selectedFormat === format.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-1">{format.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{format.label}</div>
                        <div className="text-sm text-gray-500">{format.description}</div>
                      </div>
                      {selectedFormat === format.id && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Selection */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Date Range</h3>

              {/* Preset Ranges */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={onLast7Days}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={onLast30Days}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Last 30 Days
                </button>
                <button
                  onClick={onLast90Days}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Last 90 Days
                </button>
              </div>

              {/* Month Presets */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={onThisMonth}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  This Month
                </button>
                <button
                  onClick={onLastMonth}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Last Month
                </button>
              </div>

              {/* Custom Date Range */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCustomDateChange}
                  className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Apply Custom Range
                </button>
              </div>

              {/* Current Range Display */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Selected Range:</span>{' '}
                  {formatDateForDisplay(dateRange.startDate)} → {formatDateForDisplay(dateRange.endDate)}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onExport}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin">⟳</span>
                  Exporting...
                </>
              ) : (
                <>
                  <span>📥</span>
                  Export Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
