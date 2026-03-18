'use client'

import { useEffect, useState, useMemo } from 'react'
import { useDashboardMetrics } from '@/hooks/useAnalytics'
import { useRealtime } from '@/hooks/useRealtime'
import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { AnalyticsDashboardCharts } from '@/components/charts'
import { ExportButton } from '@/components/export'
import { ContentRecommendations, OptimalScheduleRecommendation } from '@/components/recommendations'
import { UpcomingSchedulesWidget, ScheduledNotificationStatusWidget } from '@/components/scheduled-notifications'
import MLPredictionsDashboard from '@/components/MLPredictionsDashboard'

type Period = 'week' | 'month' | 'year'
type MetricType = 'meeting' | 'livestream' | 'attendance' | 'engagement'

interface DashboardStats {
  totalEvents: number
  totalAttendees: number
  avgEngagement: number
  activeMembers: number
  peakTime?: string
}

export default function AnalyticsDashboard({ churchId }: { churchId: string }) {
  const { isConnected } = useRealtime()
  const [period, setPeriod] = useState<Period>('month')
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('meeting')

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics', churchId, period],
    queryFn: async () => {
      const startDate = subDays(new Date(), period === 'week' ? 7 : period === 'month' ? 30 : 365)
      const endDate = new Date()

      const res = await fetch(
        `/api/analytics/dashboard?churchId=${churchId}&period=${period}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      if (!res.ok) throw new Error('Failed to fetch metrics')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  })

  // Calculate summary stats
  const stats = useMemo((): DashboardStats => {
    const data = metrics?.summaries?.[selectedMetric] || {}
    return {
      totalEvents: data.totalMeetings || data.totalLivestreams || data.totalEvents || 0,
      totalAttendees: data.totalAttendees || data.totalViewers || data.totalAttended || 0,
      avgEngagement: Math.round(data.avgEngagement || data.avgRetention || 0),
      activeMembers: metrics?.summaries?.engagement?.activeMembers || 0,
    }
  }, [metrics, selectedMetric])

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Analytics</h1>
          <p className="text-gray-600">Real-time metrics and insights for your church</p>
          {isConnected && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm text-green-600">Live updates enabled</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3 items-center">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <ExportButton 
            metric={selectedMetric || 'meetings'} 
            title="Church Analytics Report"
            variant="outline"
          />
        </div>
      </div>

      {/* Metric Selector */}
      <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
        {(['meeting', 'livestream', 'attendance', 'engagement'] as MetricType[]).map((metric) => (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              selectedMetric === metric
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-xs font-medium uppercase tracking-wide">
              {metric === 'meeting' && 'Meetings'}
              {metric === 'livestream' && 'Livestreams'}
              {metric === 'attendance' && 'Attendance'}
              {metric === 'engagement' && 'Engagement'}
            </div>
            <div className="mt-1 text-lg font-bold">
              {metric === 'meeting' && metrics?.summaries?.meeting?.totalMeetings}
              {metric === 'livestream' && metrics?.summaries?.livestream?.totalLivestreams}
              {metric === 'attendance' && metrics?.summaries?.attendance?.totalEvents}
              {metric === 'engagement' && 0}
            </div>
          </button>
        ))}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Events', value: stats.totalEvents },
          { label: 'Total Attendees', value: stats.totalAttendees },
          { label: 'Avg Engagement', value: `${stats.avgEngagement}%` },
          { label: 'Active Members', value: stats.activeMembers },
        ].map((card, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Data Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold mb-4">Dashboard Summary</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {selectedMetric === 'meeting' && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Meeting Metrics</h3>
                <ul className="space-y-1 text-sm">
                  <li><span className="text-gray-600">Total Meetings:</span> <span className="font-bold">{metrics?.summaries?.meeting?.totalMeetings || 0}</span></li>
                  <li><span className="text-gray-600">Avg Attendance:</span> <span className="font-bold">{Math.round(metrics?.summaries?.meeting?.avgAttendance || 0)}</span></li>
                  <li><span className="text-gray-600">Peak Attendees:</span> <span className="font-bold">{metrics?.summaries?.meeting?.peakAttendees || 0}</span></li>
                  <li><span className="text-gray-600">Avg Duration:</span> <span className="font-bold">{Math.round(metrics?.summaries?.meeting?.avgDuration || 0)} min</span></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Engagement</h3>
                <ul className="space-y-1 text-sm">
                  <li><span className="text-gray-600">Total Attendees:</span> <span className="font-bold">{metrics?.summaries?.meeting?.totalAttendees || 0}</span></li>
                  <li><span className="text-gray-600">Avg Engagement:</span> <span className="font-bold">{Math.round(metrics?.summaries?.meeting?.avgEngagement || 0)}%</span></li>
                </ul>
              </div>
            </>
          )}

          {selectedMetric === 'livestream' && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Livestream Metrics</h3>
                <ul className="space-y-1 text-sm">
                  <li><span className="text-gray-600">Total Livestreams:</span> <span className="font-bold">{metrics?.summaries?.livestream?.totalLivestreams || 0}</span></li>
                  <li><span className="text-gray-600">Total Viewers:</span> <span className="font-bold">{metrics?.summaries?.livestream?.totalViewers || 0}</span></li>
                  <li><span className="text-gray-600">Peak Viewers:</span> <span className="font-bold">{metrics?.summaries?.livestream?.peakViewers || 0}</span></li>
                  <li><span className="text-gray-600">Avg Retention:</span> <span className="font-bold">{Math.round(metrics?.summaries?.livestream?.avgRetention || 0)}%</span></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Engagement</h3>
                <ul className="space-y-1 text-sm">
                  <li><span className="text-gray-600">Total Engagement:</span> <span className="font-bold">{metrics?.summaries?.livestream?.totalEngagement || 0}</span></li>
                </ul>
              </div>
            </>
          )}

          {selectedMetric === 'attendance' && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Attendance Metrics</h3>
                <ul className="space-y-1 text-sm">
                  <li><span className="text-gray-600">Total Events:</span> <span className="font-bold">{metrics?.summaries?.attendance?.totalEvents || 0}</span></li>
                  <li><span className="text-gray-600">Total Expected:</span> <span className="font-bold">{metrics?.summaries?.attendance?.totalExpected || 0}</span></li>
                  <li><span className="text-gray-600">Total Attended:</span> <span className="font-bold">{metrics?.summaries?.attendance?.totalAttended || 0}</span></li>
                  <li><span className="text-gray-600">Late Count:</span> <span className="font-bold">{metrics?.summaries?.attendance?.totalLate || 0}</span></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Rate</h3>
                <ul className="space-y-1 text-sm">
                  <li><span className="text-gray-600">Attendance Rate:</span> <span className="font-bold">{Math.round(metrics?.summaries?.attendance?.avgAttendanceRate || 0)}%</span></li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Growth Metrics */}
      {metrics?.summaries?.growth && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold mb-4">Growth Trends</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Engagement Growth</p>
              <p className="mt-2 text-2xl font-bold">{Math.round(metrics.summaries.growth.engagementGrowth)}%</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Attendance Growth</p>
              <p className="mt-2 text-2xl font-bold">{Math.round(metrics.summaries.growth.attendanceGrowth)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Charts Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold mb-4">Interactive Analytics</h2>
        <p className="text-sm text-gray-600 mb-6">Visualize your church metrics with interactive charts</p>
        <AnalyticsDashboardCharts />
      </div>

      {/* AI Recommendations Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <OptimalScheduleRecommendation />
        <ContentRecommendations />
      </div>

      {/* Scheduled Notifications Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold mb-4">Email Digest Automation</h2>
        <p className="text-sm text-gray-600 mb-6">Automatically send recommendation digests to your team</p>
        <div className="grid gap-6 md:grid-cols-2">
          <UpcomingSchedulesWidget />
          <ScheduledNotificationStatusWidget />
        </div>
      </div>

      {/* ML Predictions Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold mb-4">🤖 ML Predictions & Forecasts</h2>
        <p className="text-sm text-gray-600 mb-6">Machine learning insights for attendance, giving, member engagement, and sermon optimization</p>
        <MLPredictionsDashboard churchId={churchId} />
      </div>
    </div>
  )
}
