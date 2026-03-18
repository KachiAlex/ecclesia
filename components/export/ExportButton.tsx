'use client'

import React, { useState } from 'react'
import { useExport, useExportFormat, useExportDateRange } from '@/hooks/useExport'
import ExportModal from './ExportModal'

export interface ExportButtonProps {
  metric: string
  title?: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  onExportStart?: () => void
  onExportComplete?: () => void
}

/**
 * ExportButton Component
 * Trigger analytics export dialog
 */
export default function ExportButton({
  metric,
  title,
  className = '',
  variant = 'default',
  onExportStart,
  onExportComplete,
}: ExportButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const exportHook = useExport()
  const formatHook = useExportFormat()
  const dateRangeHook = useExportDateRange(30)

  const handleExport = async () => {
    try {
      onExportStart?.()

      await exportHook.executeExport({
        type: formatHook.selectedFormat,
        metric,
        startDate: dateRangeHook.dateRange.startDate,
        endDate: dateRangeHook.dateRange.endDate,
        title: title || `${metric} Report`,
        includeChart: formatHook.selectedFormat === 'pdf',
        includeData: true,
        includeMetadata: true,
      })

      onExportComplete?.()
      setShowModal(false)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
      case 'ghost':
        return 'bg-transparent text-gray-900 hover:bg-gray-100'
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700'
    }
  }

  return (
    <>
      {/* Export Button */}
      <button
        onClick={() => setShowModal(true)}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${getVariantClasses()}
          ${className}
        `}
        disabled={exportHook.isLoading}
      >
        {exportHook.isLoading ? (
          <>
            <span className="inline-block animate-spin">⟳</span>
            Exporting...
          </>
        ) : (
          <>
            <span>📥</span>
            Export
          </>
        )}
      </button>

      {/* Error Message */}
      {exportHook.error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {exportHook.error}
        </div>
      )}

      {/* Success Message */}
      {exportHook.success && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          Export completed successfully! Check your downloads.
        </div>
      )}

      {/* Export Modal */}
      {showModal && (
        <ExportModal
          metric={metric}
          isOpen={showModal}
          isLoading={exportHook.isLoading}
          error={exportHook.error}
          onClose={() => setShowModal(false)}
          onExport={handleExport}
          selectedFormat={formatHook.selectedFormat}
          onFormatChange={formatHook.setSelectedFormat}
          dateRange={dateRangeHook.dateRange}
          onDateRangeChange={dateRangeHook.setRange}
          onLast7Days={dateRangeHook.setLast7Days}
          onLast30Days={dateRangeHook.setLast30Days}
          onLast90Days={dateRangeHook.setLast90Days}
          onThisMonth={dateRangeHook.setThisMonth}
          onLastMonth={dateRangeHook.setLastMonth}
        />
      )}
    </>
  )
}
