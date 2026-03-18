'use client'

import React, { useState } from 'react'
import { LineChart, BarChart, PieChart, AreaChart } from './ChartComponents'
import { useChartData, useMultiMetricChartData } from '@/hooks/useChartData'
import { ChartConfig, CHART_COLORS } from '@/lib/types/chart-types'

/**
 * Interactive Analytics Dashboard with Multiple Chart Types
 */
export function AnalyticsDashboardCharts() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  })
  const [selectedMetric, setSelectedMetric] = useState<'meetings' | 'attendance' | 'livestream' | 'engagement'>('meetings')
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area' | 'pie'>('line')
  const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // Fetch data for selected metric
  const { data, isLoading, error } = useChartData({
    dateRange,
    interval,
    metric: selectedMetric,
  })

  // Build chart config from data
  const chartConfig: ChartConfig | null = data
    ? {
        id: selectedMetric,
        title: selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1),
        type: chartType as any,
        datasets: [
          {
            label: selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1),
            data: data.rawData,
            borderColor: CHART_COLORS.primary,
            backgroundColor: CHART_COLORS.primary,
          },
        ],
        timeInterval: interval,
        startDate: dateRange.start,
        endDate: dateRange.end,
        yAxisLabel: `${selectedMetric} Count`,
        showGrid: true,
        showTooltip: true,
      }
    : null

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <p className="text-gray-600 mt-1">Interactive visualizations of your church metrics</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input
            type="date"
            value={dateRange.start.toISOString().split('T')[0]}
            onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <input
            type="date"
            value={dateRange.end.toISOString().split('T')[0]}
            onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Metric Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Metric</label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="meetings">Meetings</option>
            <option value="attendance">Attendance</option>
            <option value="livestream">Livestream</option>
            <option value="engagement">Engagement</option>
          </select>
        </div>

        {/* Chart Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="line">Line</option>
            <option value="bar">Bar</option>
            <option value="area">Area</option>
            <option value="pie">Pie</option>
          </select>
        </div>

        {/* Interval */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Interval</label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* Chart Display */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        {isLoading && <div className="text-center py-12 text-gray-600">Loading chart data...</div>}

        {error && (
          <div className="text-center py-12 text-red-600">
            <p>Error loading data: {error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        )}

        {chartConfig && !isLoading && (
          <>
            {chartType === 'line' && <LineChart config={chartConfig} />}
            {chartType === 'bar' && <BarChart config={chartConfig} />}
            {chartType === 'area' && <AreaChart config={chartConfig} />}
            {chartType === 'pie' && <PieChart config={chartConfig} />}
          </>
        )}
      </div>

      {/* Stats Summary */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">Total Data Points</p>
            <p className="text-2xl font-bold text-blue-600">{data.rawData.length}</p>
          </div>

          {data?.trend && (
            <>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Peak Value</p>
                <p className="text-2xl font-bold text-green-600">{(data.trend as any)?.maxValue?.toFixed(0) || '0'}</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600">Average</p>
                <p className="text-2xl font-bold text-purple-600">{((data.trend as any)?.avgValue || 0).toFixed(0)}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Comparison Charts - Multiple Metrics */}
      <ComparisonCharts dateRange={dateRange} interval={interval} />
    </div>
  )
}

/**
 * Comparison Charts Component - Multiple metrics side by side
 */
function ComparisonCharts({
  dateRange,
  interval,
}: {
  dateRange: { start: Date; end: Date }
  interval: 'daily' | 'weekly' | 'monthly'
}) {
  const metrics = ['meetings', 'attendance', 'livestream', 'engagement']
  const { data, isLoading } = useMultiMetricChartData(metrics, { dateRange, interval })

  if (isLoading) return <div className="text-center py-8 text-gray-600">Loading comparison data...</div>

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Metric Comparison</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data &&
          metrics.map((metric) => {
            const metricData = data[metric]
            if (!metricData) return null

            const config: ChartConfig = {
              id: metric,
              title: metric.charAt(0).toUpperCase() + metric.slice(1),
              type: 'line',
              datasets: [
                {
                  label: metric.charAt(0).toUpperCase() + metric.slice(1),
                  data: metricData.rawData || [],
                  borderColor: CHART_COLORS.primary,
                },
              ],
              timeInterval: interval,
              startDate: dateRange.start,
              endDate: dateRange.end,
              yAxisLabel: `${metric} Count`,
            }

            return (
              <div key={metric} className="p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">{metric.toUpperCase()}</h4>
                <LineChart config={config} />
              </div>
            )
          })}
      </div>
    </div>
  )
}

/**
 * Chart Gallery - Preview all chart types
 */
export function ChartGallery() {
  const { data } = useChartData({ metric: 'meetings' })

  if (!data) return <div>Loading chart gallery...</div>

  const testConfig: ChartConfig = {
    id: 'test-chart',
    title: 'Test Chart',
    type: 'line',
    datasets: [
      {
        label: 'Test Data',
        data: data.rawData.slice(0, 10),
        borderColor: CHART_COLORS.primary,
      },
    ],
    timeInterval: 'daily',
    startDate: new Date(),
    endDate: new Date(),
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Chart Types Gallery</h2>
        <p className="text-gray-600 mb-6">Explore different chart visualization options</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Line Chart</h3>
          <LineChart config={{ ...testConfig, type: 'line' }} />
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Bar Chart</h3>
          <BarChart config={{ ...testConfig, type: 'bar' }} />
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Area Chart</h3>
          <AreaChart config={{ ...testConfig, type: 'area' }} />
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Pie Chart</h3>
          <PieChart config={{ ...testConfig, type: 'pie' }} />
        </div>
      </div>
    </div>
  )
}
