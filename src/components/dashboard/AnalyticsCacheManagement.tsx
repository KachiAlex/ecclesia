/**
 * Analytics Cache Management Component
 * Dashboard UI for monitoring and managing analytics cache
 */

'use client'

import React from 'react'
import { useAnalyticsCache, useAnalyticsCacheStatus } from '@/hooks/useAnalyticsCache'
import { formatDistanceToNow } from 'date-fns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, RotateCcw, TrendingUp } from 'lucide-react'

interface AnalyticsCacheManagementProps {
  compact?: boolean
}

export function AnalyticsCacheManagement({
  compact = false,
}: AnalyticsCacheManagementProps) {
  const { status, isLoading, error, refreshStatus } = useAnalyticsCacheStatus()
  const { refreshCache, isRefreshing } = useAnalyticsCache()

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'ok':
        return 'bg-green-50 border-green-200'
      case 'refresh':
        return 'bg-yellow-50 border-yellow-200'
      case 'insufficient-data':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'ok':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Cache Fresh
          </Badge>
        )
      case 'refresh':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Needs Refresh
          </Badge>
        )
      case 'insufficient-data':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Insufficient Data
          </Badge>
        )
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error || !status) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertCircle className="w-5 h-5" />
            Cache Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700">
            {error ? error.message : 'Failed to load cache status'}
          </p>
          <Button
            onClick={() => refreshStatus()}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700">
            {status.isValid ? 'Cache Fresh' : 'Cache Stale'}
          </div>
          {status.lastUpdated && (
            <div className="text-xs text-gray-500">
              Updated {formatDistanceToNow(new Date(status.lastUpdated), {
                addSuffix: true,
              })}
            </div>
          )}
        </div>
        <Button
          onClick={() => refreshCache()}
          disabled={isRefreshing}
          size="sm"
          variant="outline"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
    )
  }

  return (
    <Card
      className={`border-2 ${getRecommendationColor(status.recommendation)}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Analytics Cache
            </CardTitle>
            <CardDescription>
              Real-time data aggregation status and management
            </CardDescription>
          </div>
          {getRecommendationBadge(status.recommendation)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cache Status Section */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Cache Exists
            </label>
            <p className="text-lg font-semibold">
              {status.cacheExists ? '✓' : '✗'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Cache Valid
            </label>
            <p className="text-lg font-semibold">
              {status.isValid ? '✓' : '✗'}
            </p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Last Updated
            </label>
            <p className="text-gray-700">
              {status.lastUpdated
                ? formatDistanceToNow(new Date(status.lastUpdated), {
                    addSuffix: true,
                  })
                : 'Never'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Next Refresh
            </label>
            <p className="text-gray-700">
              {status.nextRefresh
                ? formatDistanceToNow(new Date(status.nextRefresh), {
                    addSuffix: true,
                  })
                : '—'}
            </p>
          </div>
        </div>

        {/* Data Quality */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Data Quality
            </label>
            <span
              className={`text-2xl font-bold ${getQualityColor(
                status.qualityScore
              )}`}
            >
              {status.qualityScore}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                status.qualityScore >= 80
                  ? 'bg-green-500'
                  : status.qualityScore >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${status.qualityScore}%` }}
            ></div>
          </div>
        </div>

        {/* Data Metrics */}
        <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-3 rounded">
          <div>
            <span className="text-gray-500">Events</span>
            <p className="font-semibold text-gray-900">
              {status.dataQuality.eventsCount}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Members</span>
            <p className="font-semibold text-gray-900">
              {status.dataQuality.membersCount}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Avg Attendance</span>
            <p className="font-semibold text-gray-900">
              {status.dataQuality.avgEventAttendance.toFixed(1)}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Completeness</span>
            <p className="font-semibold text-gray-900">
              {status.dataQuality.dataCompleteness}%
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <Button
            onClick={() => refreshCache()}
            disabled={isRefreshing || status.isValid}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
          </Button>
          <Button
            onClick={() => refreshStatus()}
            variant="outline"
            className="flex-1"
          >
            Check Status
          </Button>
        </div>

        {/* Recommendations */}
        {status.recommendation === 'refresh' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
            <p className="font-medium">⚠️ Cache Refresh Needed</p>
            <p className="text-xs mt-1">
              The analytics cache is approaching expiration. Click "Refresh Now" to
              update with latest data.
            </p>
          </div>
        )}

        {status.recommendation === 'insufficient-data' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <p className="font-medium">❌ Insufficient Data</p>
            <p className="text-xs mt-1">
              Not enough data to generate reliable analytics. Ensure users, events,
              and content are tracked.
            </p>
          </div>
        )}

        {status.recommendation === 'ok' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            <p className="font-medium">✓ Cache Optimal</p>
            <p className="text-xs mt-1">
              Analytics cache is fresh and contains sufficient data for reliable
              recommendations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AnalyticsCacheManagement
