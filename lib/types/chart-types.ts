/**
 * Phase 4.1: Advanced Analytics - Chart Types & Utilities
 * Interactive charts for meeting, livestream, and attendance analytics
 */

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'mixed'
export type TimeInterval = 'daily' | 'weekly' | 'monthly'
export type MetricName = 'attendance' | 'engagement' | 'viewers' | 'duration' | 'completionRate'

/**
 * Chart Data Point
 */
export interface ChartDataPoint {
  time: Date | string
  value: number
  label?: string
  color?: string
  metadata?: Record<string, any>
}

/**
 * Chart Dataset
 */
export interface ChartDataset {
  label: string
  data: ChartDataPoint[]
  borderColor?: string
  backgroundColor?: string
  fill?: boolean
  tension?: number
  type?: 'line' | 'bar' | 'area'
}

/**
 * Chart Configuration
 */
export interface ChartConfig {
  id: string
  title: string
  subtitle?: string
  type: ChartType
  datasets: ChartDataset[]
  timeInterval: TimeInterval
  startDate: Date
  endDate: Date
  yAxisLabel?: string
  xAxisLabel?: string
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  responsive?: boolean
  height?: number
}

/**
 * Trend Analysis
 */
export interface TrendAnalysis {
  metric: MetricName
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
  avgValue: number
  minValue: number
  maxValue: number
  peakDate?: Date
}

/**
 * Comparison Data
 */
export interface ComparisonData {
  period1: {
    label: string
    value: number
    color?: string
  }
  period2: {
    label: string
    value: number
    color?: string
  }
  difference: number
  percentChange: number
}

/**
 * Analytics Summary for Chart
 */
export interface AnalyticsSummary {
  totalValue: number
  averageValue: number
  peakValue: number
  lowestValue: number
  peakDate?: Date
  lowestDate?: Date
  trends: TrendAnalysis[]
  comparisons: ComparisonData[]
}

/**
 * Chart Color Schemes
 */
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  light: '#f3f4f6',
  dark: '#1f2937',
}

export const CHART_PALETTE = {
  meeting: ['#3b82f6', '#60a5fa', '#93c5fd'],
  livestream: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
  attendance: ['#10b981', '#34d399', '#6ee7b7'],
  engagement: ['#f59e0b', '#fbbf24', '#fcd34d'],
  mixed: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
}

/**
 * Predefined Chart Templates
 */
export const CHART_TEMPLATES = {
  attendance_trend: {
    type: 'area' as const,
    yAxisLabel: 'Attendance Count',
    showGrid: true,
    showLegend: true,
    showTooltip: true,
    responsive: true,
    height: 300,
  },
  engagement_line: {
    type: 'line' as const,
    yAxisLabel: 'Engagement Score (%)',
    showGrid: true,
    showLegend: true,
    showTooltip: true,
    responsive: true,
    height: 300,
  },
  meeting_comparison: {
    type: 'bar' as const,
    yAxisLabel: 'Count',
    showGrid: true,
    showLegend: true,
    showTooltip: true,
    responsive: true,
    height: 300,
  },
  viewer_distribution: {
    type: 'pie' as const,
    showLegend: true,
    showTooltip: true,
    responsive: true,
    height: 300,
  },
  engagement_donut: {
    type: 'donut' as const,
    showLegend: true,
    showTooltip: true,
    responsive: true,
    height: 300,
  },
}

/**
 * Format data for daily/weekly/monthly intervals
 */
export function formatChartDataByInterval(
  data: ChartDataPoint[],
  interval: TimeInterval
): ChartDataPoint[] {
  if (!data || data.length === 0) return []

  const grouped: Record<string, ChartDataPoint[]> = {}

  data.forEach((point) => {
    const date = new Date(point.time)
    let key: string

    if (interval === 'daily') {
      key = date.toISOString().split('T')[0]
    } else if (interval === 'weekly') {
      const weekNum = getWeekNumber(date)
      key = `Week ${weekNum} ${date.getFullYear()}`
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }

    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(point)
  })

  return Object.entries(grouped).map(([key, points]) => ({
    time: key,
    value: points.reduce((sum, p) => sum + p.value, 0) / points.length,
    label: key,
  }))
}

/**
 * Calculate trend analysis
 */
export function calculateTrendAnalysis(
  metric: MetricName,
  currentData: ChartDataPoint[],
  previousData: ChartDataPoint[]
): TrendAnalysis {
  const currentValues = currentData.map((p) => p.value)
  const previousValues = previousData.map((p) => p.value)

  const currentAvg = currentValues.length > 0 ? currentValues.reduce((a, b) => a + b) / currentValues.length : 0
  const previousAvg = previousValues.length > 0 ? previousValues.reduce((a, b) => a + b) / previousValues.length : 0

  const change = currentAvg - previousAvg
  const changePercent = previousAvg !== 0 ? (change / previousAvg) * 100 : 0

  return {
    metric,
    current: currentAvg,
    previous: previousAvg,
    change,
    changePercent,
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    avgValue: currentAvg,
    minValue: Math.min(...currentValues),
    maxValue: Math.max(...currentValues),
    peakDate: currentData[currentValues.indexOf(Math.max(...currentValues))]?.time as Date,
  }
}

/**
 * Get week number
 */
function getWeekNumber(date: Date): number {
  const firstDay = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDay.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7)
}

/**
 * Generate comparison data
 */
export function generateComparisonData(
  label1: string,
  value1: number,
  label2: string,
  value2: number,
  color1?: string,
  color2?: string
): ComparisonData {
  const difference = value1 - value2
  const percentChange = value2 !== 0 ? (difference / value2) * 100 : 0

  return {
    period1: {
      label: label1,
      value: value1,
      color: color1,
    },
    period2: {
      label: label2,
      value: value2,
      color: color2,
    },
    difference,
    percentChange,
  }
}

/**
 * Calculate analytics summary
 */
export function calculateAnalyticsSummary(
  metrics: TrendAnalysis[],
  comparisons: ComparisonData[]
): AnalyticsSummary {
  const values = metrics.map((m) => m.current)
  const totalValue = values.reduce((a, b) => a + b, 0)
  const averageValue = values.length > 0 ? totalValue / values.length : 0
  const peakValue = Math.max(...values)
  const lowestValue = Math.min(...values)

  return {
    totalValue,
    averageValue,
    peakValue,
    lowestValue,
    trends: metrics,
    comparisons,
  }
}
