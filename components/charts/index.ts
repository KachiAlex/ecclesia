// Chart Components
export { LineChart, BarChart, PieChart, AreaChart } from './ChartComponents'

// Dashboard Components
export { AnalyticsDashboardCharts, ChartGallery } from './AnalyticsDashboardCharts'

// Types and Utilities
export type {
  ChartDataPoint,
  ChartDataset,
  ChartConfig,
  TrendAnalysis,
  ComparisonData,
  AnalyticsSummary,
} from '@/lib/types/chart-types'

export {
  CHART_COLORS,
  CHART_TEMPLATES,
  formatChartDataByInterval,
  calculateTrendAnalysis,
  generateComparisonData,
  calculateAnalyticsSummary,
} from '@/lib/types/chart-types'

// Hooks
export { useChartData, useMultiMetricChartData, useRealtimeChartData, useChartDataWithRefresh } from '@/hooks/useChartData'

export type { UseChartDataOptions } from '@/hooks/useChartData'
