# Phase 4.1: Interactive Charts & Graphs - Implementation Guide

## Overview

Phase 4.1 delivers a complete interactive charting system for the Ecclesia church management platform. This implementation includes four built-in chart types (Line, Bar, Area, Pie), comprehensive data utilities, and an interactive dashboard.

**Status:** ✅ Production Ready  
**Files Created:** 5  
**Total Lines of Code:** 800+  
**Build Status:** ✅ Passing

---

## Architecture

### Component Hierarchy

```
AnalyticsDashboardCharts (Main Dashboard)
├── LineChart (SVG-based)
├── BarChart (SVG-based)
├── AreaChart (SVG-based)
├── PieChart (SVG-based)
├── ComparisonCharts (Multi-metric view)
└── ChartGallery (Chart preview)
```

### Data Flow

```
API Route (/api/analytics/chart-data)
    ↓
useChartData Hook
    ↓
Chart Formatters (formatChartDataByInterval)
    ↓
Chart Components (LineChart, BarChart, etc)
```

---

## Core Components

### 1. Chart Components (`components/charts/ChartComponents.tsx`)

Four SVG-based chart components with responsive scaling:

#### LineChart
- **Use Case:** Time series trends
- **Props:** `config: ChartConfig`
- **Features:**
  - Multiple series support
  - Grid overlay
  - Interactive tooltips
  - Automatic axis scaling

```tsx
import { LineChart } from '@/components/charts'

<LineChart config={{
  type: 'line',
  datasets: [{ label: 'Meetings', data: chartData }],
  yAxisLabel: 'Count',
  showGrid: true
}} />
```

#### BarChart
- **Use Case:** Category comparison
- **Props:** `config: ChartConfig`
- **Features:**
  - Multi-series grouping
  - Responsive bar width
  - Hover effects

```tsx
<BarChart config={chartConfig} />
```

#### AreaChart
- **Use Case:** Cumulative metrics
- **Props:** `config: ChartConfig`
- **Features:**
  - Semi-transparent fill
  - Smooth curves
  - Multiple areas

```tsx
<AreaChart config={chartConfig} />
```

#### PieChart
- **Use Case:** Proportional breakdown
- **Props:** `config: ChartConfig`
- **Features:**
  - Automatic color assignment
  - Legend with percentages
  - Proportional slices

```tsx
<PieChart config={chartConfig} />
```

### 2. Dashboard Component (`components/charts/AnalyticsDashboardCharts.tsx`)

Interactive dashboard with metric selection and chart type switching:

```tsx
import { AnalyticsDashboardCharts } from '@/components/charts'

<AnalyticsDashboardCharts />
```

**Features:**
- Date range picker
- Metric selector (Meetings, Attendance, Livestream, Engagement)
- Chart type switcher
- Interval selection (Daily, Weekly, Monthly)
- Statistics summary cards
- Multi-metric comparison view

**State Management:**
- Uses React hooks for local state
- React Query for data fetching
- Automatic refetching on parameter changes

### 3. Chart Gallery (`components/charts/AnalyticsDashboardCharts.tsx`)

Preview component showcasing all chart types:

```tsx
import { ChartGallery } from '@/components/charts'

<ChartGallery />
```

---

## Data Types (`lib/types/chart-types.ts`)

### ChartDataPoint
Individual data point in a dataset:

```typescript
interface ChartDataPoint {
  label: string           // Display label (date, category, etc)
  value: number          // Numeric value
  metadata?: {           // Optional additional data
    date?: string
    details?: Record<string, any>
  }
}
```

### ChartDataset
Collection of related data points:

```typescript
interface ChartDataset {
  label: string          // Dataset name ("Meetings", "Attendance", etc)
  data: ChartDataPoint[] // Array of data points
  borderColor?: string   // Line color
  backgroundColor?: string // Fill color
}
```

### ChartConfig
Complete chart configuration:

```typescript
interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie'
  datasets: ChartDataset[]
  labels?: string[]
  yAxisLabel?: string
  showGrid?: boolean
  showTooltip?: boolean
  height?: number
}
```

### TrendAnalysis
Calculated trend metrics:

```typescript
interface TrendAnalysis {
  currentValue: number
  previousValue: number
  changePercentage: number
  trend: 'up' | 'down' | 'flat'
  peakValue: number
  minValue: number
  averageValue: number
}
```

### AnalyticsSummary
Aggregated metrics across datasets:

```typescript
interface AnalyticsSummary {
  totalDataPoints: number
  metricCount: number
  periodStart: Date
  periodEnd: Date
  trends: Record<string, TrendAnalysis>
}
```

---

## Utility Functions

### formatChartDataByInterval
Convert raw data points to aggregated intervals:

```typescript
const formatted = formatChartDataByInterval(rawData, 'daily')
// Returns: ChartDataPoint[] grouped by day
```

**Intervals:**
- `'daily'` - Group by calendar day
- `'weekly'` - Group by ISO week
- `'monthly'` - Group by calendar month

### calculateTrendAnalysis
Compute trend metrics:

```typescript
const trend = calculateTrendAnalysis(dataPoints)
// Returns: { currentValue, changePercentage, trend, peakValue, ... }
```

### generateComparisonData
Create period-over-period comparison:

```typescript
const comparison = generateComparisonData(current, previous)
// Returns: { metric1GrowthPercent, metric2GrowthPercent, ... }
```

### calculateAnalyticsSummary
Aggregate all analytics:

```typescript
const summary = calculateAnalyticsSummary([dataset1, dataset2])
// Returns: Comprehensive summary with all metrics
```

---

## Hooks (`hooks/useChartData.ts`)

### useChartData
Main hook for fetching formatted chart data:

```typescript
const { data, isLoading, error } = useChartData({
  dateRange: { start, end },
  metric: 'meetings',
  interval: 'daily',
  church: churchId
})

// data.rawData: ChartDataPoint[]
// data.formatted: Aggregated by interval
// data.trend: TrendAnalysis
// data.summary: AnalyticsSummary
```

**Options:**
- `dateRange?: { start: Date; end: Date }` - Time period
- `metric?: string` - Which metric to fetch (meetings, attendance, livestream, engagement)
- `interval?: 'daily' | 'weekly' | 'monthly'` - Aggregation level
- `church?: string` - Filter by church

### useMultiMetricChartData
Fetch multiple metrics simultaneously:

```typescript
const { data, isLoading } = useMultiMetricChartData(
  ['meetings', 'attendance', 'livestream'],
  { dateRange, interval }
)

// data: Record<'meetings'|'attendance'|'livestream', ChartData>
```

### useRealtimeChartData
Chart data with real-time Socket.io updates:

```typescript
const { data, isLoading } = useRealtimeChartData('meetings', options)
// Real-time updates via Socket.io broadcasting
```

### useChartDataWithRefresh
Auto-refreshing chart data:

```typescript
const { data, isLoading } = useChartDataWithRefresh(
  options,
  30000 // Refresh every 30 seconds
)
```

---

## API Route (`app/api/analytics/chart-data/route.ts`)

**Endpoint:** `GET /api/analytics/chart-data`

**Query Parameters:**
- `metric` (default: 'meetings') - meetings | attendance | livestream | engagement
- `startDate` (optional) - ISO date string
- `endDate` (optional) - ISO date string
- `interval` (default: 'daily') - daily | weekly | monthly
- `church` (optional) - Church ID filter

**Response:**
```typescript
{
  success: boolean
  metric: string
  dataPoints: number
  data: ChartDataPoint[]
  formatted: ChartDataPoint[] // By interval
  startDate: Date
  endDate: Date
}
```

**Example:**
```bash
GET /api/analytics/chart-data?metric=meetings&interval=weekly&startDate=2024-01-01T00:00:00Z
```

---

## Integration Examples

### 1. Simple Line Chart
```tsx
'use client'
import { LineChart, useChartData } from '@/components/charts'

export function MeetingsTrendChart() {
  const { data } = useChartData({ metric: 'meetings' })

  if (!data) return <div>Loading...</div>

  return (
    <LineChart config={{
      type: 'line',
      datasets: [{
        label: 'Meetings',
        data: data.rawData,
        borderColor: '#3b82f6'
      }],
      yAxisLabel: 'Count'
    }} />
  )
}
```

### 2. Comparison Dashboard
```tsx
export function MetricsComparison() {
  const { data } = useMultiMetricChartData(['meetings', 'attendance', 'livestream'])

  return (
    <div className="grid grid-cols-3 gap-4">
      {Object.entries(data || {}).map(([metric, chartData]) => (
        <BarChart key={metric} config={{
          type: 'bar',
          datasets: [{
            label: metric,
            data: chartData.rawData
          }]
        }} />
      ))}
    </div>
  )
}
```

### 3. Date-ranged Analytics
```tsx
export function CustomAnalytics() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    end: new Date()
  })

  const { data } = useChartData({
    metric: 'attendance',
    dateRange,
    interval: 'weekly'
  })

  return (
    <>
      <DateRangePicker value={dateRange} onChange={setDateRange} />
      <AreaChart config={{...}} />
    </>
  )
}
```

---

## Color Schemes

Predefined color palette in `CHART_COLORS`:

```typescript
export const CHART_COLORS = {
  primary: '#3b82f6',         // Blue
  secondary: '#8b5cf6',       // Purple
  success: '#10b981',         // Green
  warning: '#f59e0b',         // Amber
  danger: '#ef4444',          // Red
  info: '#06b6d4',            // Cyan
  light: '#e5e7eb',           // Gray
  dark: '#1f2937'             // Dark Gray
}
```

**Metric-specific colors:**
- `meetings` → Blue
- `attendance` → Green
- `livestream` → Purple
- `engagement` → Amber

---

## Chart Templates

Five predefined templates in `CHART_TEMPLATES`:

1. **Trend Template** - Time series line chart
2. **Comparison Template** - Side-by-side bar chart
3. **Distribution Template** - Pie chart breakdown
4. **Cumulative Template** - Stacked area chart
5. **Growth Template** - Multi-line trend comparison

---

## Performance Considerations

### Data Points
- Optimal performance: 1-500 data points
- Acceptable: 500-2000 data points
- Degraded: 2000+ data points
- **Recommendation:** Use interval aggregation for large datasets

### Rendering
- All charts use SVG for crisp rendering at any scale
- Responsive sizing based on container width
- Lazy rendering of data points
- Memoization of expensive calculations

### Caching
- React Query deduplicates identical requests
- 5 minute cache for dashboard metrics (configurable)
- Manual refresh: `queryClient.invalidateQueries()`

---

## Testing

### Chart Component Tests
```typescript
// Test line chart renders with data
render(
  <LineChart config={testConfig} />
)
expect(screen.getByRole('img')).toBeInTheDocument()

// Test data loading state
const { data } = useChartData({ metric: 'meetings' })
expect(data).toBeDefined()
```

### Hook Tests
```typescript
// Test data fetching
const { result } = renderHook(() => useChartData({ metric: 'attendance' }))
await waitFor(() => expect(result.current.data).toBeDefined())

// Test error handling
const { result } = renderHook(() => useChartData({ metric: 'invalid' }))
expect(result.current.error).toBeDefined()
```

---

## Common Issues & Solutions

### Charts Not Rendering
- ✅ Verify `config` prop is passed correctly
- ✅ Check data has values > 0
- ✅ Ensure ChartDataPoint[] array is populated

### Data Not Loading
- ✅ Check API endpoint is accessible
- ✅ Verify query parameters are valid
- ✅ Check error logs in console
- ✅ Monitor network requests in DevTools

### Performance Issues
- ✅ Reduce number of data points with interval aggregation
- ✅ Increase chart height for better rendering
- ✅ Use React Query staleTime to reduce refetches
- ✅ Implement virtualization for 1000+ points

### Styling Issues
- ✅ SVG components inherit text/border colors
- ✅ Use `className` on wrapper div for spacing
- ✅ Colors work best with contrasting theme colors

---

## Future Enhancements

### Phase 4.2 (Export Capabilities)
- PDF export of charts
- CSV data export
- Email report scheduling

### Phase 4.3 (Predictive Analytics)
- Trend forecasting
- Anomaly detection
- ML-based insights

### Phase 4.4 (Engagement Scoring)
- Member engagement metrics
- Participation scoring
- Behavior analytics

### Phase 4.5 (Custom Reports)
- Drag-and-drop report builder
- Save/load custom reports
- Scheduled report delivery

---

## File Structure

```
ecclesia/
├── components/charts/
│   ├── ChartComponents.tsx          (4 chart types)
│   ├── AnalyticsDashboardCharts.tsx (Dashboard + Gallery)
│   └── index.ts                     (Exports)
├── hooks/
│   └── useChartData.ts              (4 hooks)
├── lib/types/
│   └── chart-types.ts               (Types + utilities)
├── app/api/analytics/
│   └── chart-data/
│       └── route.ts                 (API endpoint)
└── components/
    └── AnalyticsDashboard.tsx       (Updated with charts)
```

---

## Summary

✅ **Phase 4.1 Complete**

- 4 interactive chart components (Line, Bar, Area, Pie)
- Comprehensive data formatting utilities
- 4 specialized React hooks for data fetching
- Interactive dashboard with metric/chart/interval selection
- Full TypeScript support with JSDoc documentation
- SVG-based rendering (no external dependencies)
- Color schemes and templates
- API integration ready for Phase 4.2+

**Next Steps:**
→ Phase 4.2: Export Capabilities (PDF/CSV)
