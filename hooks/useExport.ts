import { useState } from 'react'

export interface ExportOptions {
  type: 'pdf' | 'csv' | 'json'
  metric: string
  startDate: Date
  endDate: Date
  interval?: 'daily' | 'weekly' | 'monthly'
  title?: string
  includeChart?: boolean
  includeData?: boolean
  includeMetadata?: boolean
  church?: string
}

export interface ExportScheduleOptions extends ExportOptions {
  recipients?: string[]
  schedule: 'once' | 'daily' | 'weekly' | 'monthly'
  nextRun?: Date
}

/**
 * useExport Hook
 * Manages analytics export operations (PDF, CSV, JSON)
 */
export function useExport() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  /**
   * Execute export and trigger download
   */
  const executeExport = async (options: ExportOptions) => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!options.metric || !options.startDate || !options.endDate) {
        throw new Error('Metric, startDate, and endDate are required')
      }

      // Call API
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: options.type,
          metric: options.metric,
          startDate: options.startDate.toISOString?.() || options.startDate,
          endDate: options.endDate.toISOString?.() || options.endDate,
          interval: options.interval || 'daily',
          title: options.title || `${options.metric} Report`,
          includeChart: options.includeChart ?? false,
          includeData: options.includeData ?? true,
          includeMetadata: options.includeMetadata ?? true,
          church: options.church || 'default-church',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition') || ''
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `export.${options.type}`

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setSuccess(true)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed'
      setError(message)
      setSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Export as PDF
   */
  const exportPDF = async (metric: string, startDate: Date, endDate: Date, title?: string) => {
    return executeExport({
      type: 'pdf',
      metric,
      startDate,
      endDate,
      title,
      includeChart: true,
      includeData: true,
      includeMetadata: true,
    })
  }

  /**
   * Export as CSV
   */
  const exportCSV = async (metric: string, startDate: Date, endDate: Date, interval?: string) => {
    return executeExport({
      type: 'csv',
      metric,
      startDate,
      endDate,
      interval: (interval as any) || 'daily',
      includeData: true,
      includeMetadata: true,
    })
  }

  /**
   * Export as JSON
   */
  const exportJSON = async (metric: string, startDate: Date, endDate: Date) => {
    return executeExport({
      type: 'json',
      metric,
      startDate,
      endDate,
    })
  }

  /**
   * Schedule export (for future implementation with backend job queue)
   */
  const scheduleExport = async (options: ExportScheduleOptions) => {
    setIsLoading(true)
    setError(null)

    try {
      // This would integrate with a job queue service (e.g., Bull, Inngest)
      // For now, this is a placeholder for scheduled exports
      console.log('Scheduling export:', options)

      // TODO: Implement job queue integration
      throw new Error('Scheduled exports not yet implemented')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Schedule failed'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    success,
    executeExport,
    exportPDF,
    exportCSV,
    exportJSON,
    scheduleExport,
  }
}

/**
 * Helper hook to manage export format selection
 */
export function useExportFormat() {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv' | 'json'>('pdf')

  const formats = [
    {
      id: 'pdf',
      label: 'PDF Document',
      description: 'Professional report with headers and metrics',
      icon: '📄',
    },
    {
      id: 'csv',
      label: 'CSV Spreadsheet',
      description: 'Compatible with Excel and spreadsheet apps',
      icon: '📊',
    },
    {
      id: 'json',
      label: 'JSON Data',
      description: 'Structured data for integration and analysis',
      icon: '{ }',
    },
  ]

  return {
    selectedFormat,
    setSelectedFormat,
    formats,
  }
}

/**
 * Helper hook to manage date range selection
 */
export function useExportDateRange(defaultDays: number = 30) {
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date }>({
    endDate: new Date(),
    startDate: new Date(Date.now() - defaultDays * 24 * 60 * 60 * 1000),
  })

  const setRange = (startDate: Date | string, endDate: Date | string) => {
    setDateRange({
      startDate: typeof startDate === 'string' ? new Date(startDate) : startDate,
      endDate: typeof endDate === 'string' ? new Date(endDate) : endDate,
    })
  }

  const setLast7Days = () => {
    const now = new Date()
    setDateRange({
      endDate: now,
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    })
  }

  const setLast30Days = () => {
    const now = new Date()
    setDateRange({
      endDate: now,
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    })
  }

  const setLast90Days = () => {
    const now = new Date()
    setDateRange({
      endDate: now,
      startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    })
  }

  const setThisMonth = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    setDateRange({
      startDate: firstDay,
      endDate: now,
    })
  }

  const setLastMonth = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
    setDateRange({
      startDate: firstDay,
      endDate: lastDay,
    })
  }

  return {
    dateRange,
    setRange,
    setLast7Days,
    setLast30Days,
    setLast90Days,
    setThisMonth,
    setLastMonth,
  }
}
