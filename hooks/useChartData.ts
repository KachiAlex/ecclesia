import { useQuery } from '@tanstack/react-query'
import {
  ChartConfig,
  ChartDataPoint,
  formatChartDataByInterval,
  calculateTrendAnalysis,
  calculateAnalyticsSummary,
} from '@/lib/types/chart-types'

export interface UseChartDataOptions {
  dateRange?: { start: Date; end: Date }
  interval?: 'daily' | 'weekly' | 'monthly'
  metric?: string
  church?: string
}

/**
 * Hook to fetch and format chart data from analytics API
 */
export function useChartData(options: UseChartDataOptions = {}) {
  const { dateRange, interval = 'daily', metric = 'meetings', church } = options

  return useQuery({
    queryKey: ['chartData', dateRange, interval, metric, church],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateRange?.start) params.append('startDate', dateRange.start.toISOString())
      if (dateRange?.end) params.append('endDate', dateRange.end.toISOString())
      if (metric) params.append('metric', metric)
      if (interval) params.append('interval', interval)
      if (church) params.append('church', church)

      const response = await fetch(`/api/analytics/chart-data?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch chart data')
      }

      const data = await response.json()
      return {
        rawData: data.data as ChartDataPoint[],
        formatted: formatChartDataByInterval(data.data, interval as any),
        trend: undefined,
        summary: undefined,
      }
    },
    enabled: !!metric,
  })
}

/**
 * Hook for multi-metric chart data (comparison)
 */
export function useMultiMetricChartData(metrics: string[], options: UseChartDataOptions = {}) {
  return useQuery({
    queryKey: ['multiChartData', metrics, options.dateRange, options.interval],
    queryFn: async () => {
      const results: Record<string, any> = {}

      for (const metric of metrics) {
        const params = new URLSearchParams()
        if (options.dateRange?.start) params.append('startDate', options.dateRange.start.toISOString())
        if (options.dateRange?.end) params.append('endDate', options.dateRange.end.toISOString())
        params.append('metric', metric)
        if (options.interval) params.append('interval', options.interval)
        if (options.church) params.append('church', options.church)

        const response = await fetch(`/api/analytics/chart-data?${params}`)

        if (response.ok) {
          const data = await response.json()
          results[metric] = {
            rawData: data.data || [],
            formatted: formatChartDataByInterval(data.data || [], options.interval || 'daily'),
          }
        }
      }

      return results
    },
    enabled: metrics.length > 0,
  })
}

/**
 * Hook for real-time chart updates via WebSocket
 */
export function useRealtimeChartData(metric: string, options: UseChartDataOptions = {}) {
  const { data, isLoading, error } = useChartData({ metric, ...options })

  return {
    data,
    isLoading,
    error,
    // Real-time updates would come via Socket.io in actual implementation
  }
}

/**
 * Hook for chart data with automatic refresh
 */
export function useChartDataWithRefresh(
  options: UseChartDataOptions = {},
  refreshInterval: number = 30000 // 30 seconds
) {
  return useQuery({
    queryKey: ['chartDataRefresh', options],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options.dateRange?.start) params.append('startDate', options.dateRange.start.toISOString())
      if (options.dateRange?.end) params.append('endDate', options.dateRange.end.toISOString())
      if (options.metric) params.append('metric', options.metric)
      if (options.interval) params.append('interval', options.interval)
      if (options.church) params.append('church', options.church)

      const response = await fetch(`/api/analytics/chart-data?${params}`)
      if (!response.ok) throw new Error('Failed to fetch chart data')
      return response.json()
    },
    refetchInterval: refreshInterval,
    enabled: !!options.metric,
  })
}
