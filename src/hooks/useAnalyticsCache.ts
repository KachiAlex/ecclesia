/**
 * React Hooks for Analytics Cache Management (PostgreSQL)
 * Integration layer for cached analytics with React Query
 */

'use client'

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useChurch } from '@/hooks/useChurch'
import { CachedAnalytics } from '@/lib/services/analytics-cache-service-postgres'

interface CacheStatus {
  churchId: string
  cacheExists: boolean
  isValid: boolean
  lastUpdated: Date | null
  nextRefresh: Date | null
  cacheAge: number | null // minutes
  dataQuality: {
    dataCompleteness: number
    eventsCount: number
    membersCount: number
    avgEventAttendance: number
  }
  qualityScore: number
  recommendation: 'refresh' | 'insufficient-data' | 'ok'
}

interface UseAnalyticsCacheReturn {
  analytics: CachedAnalytics | null
  status: CacheStatus | null
  isLoading: boolean
  error: Error | null
  refreshCache: () => Promise<void>
  isRefreshing: boolean
}

interface UseAnalyticsCacheStatusReturn {
  status: CacheStatus | null
  isLoading: boolean
  error: Error | null
  refreshStatus: () => Promise<void>
  lastChecked: Date | null
}

/**
 * Hook to get cached analytics data
 */
export function useAnalyticsCache(): UseAnalyticsCacheReturn {
  const { church } = useChurch()
  const queryClient = useQueryClient()

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analyticsCache', church?.id],
    queryFn: async () => {
      if (!church?.id) return null

      const response = await fetch(`/api/analytics/cache-postgres?churchId=${church.id}`)
      if (!response.ok) throw new Error('Failed to fetch analytics cache')
      return response.json()
    },
    enabled: !!church?.id,
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 60 * 60 * 1000, // 1 hour
  })

  const { data: status } = useQuery({
    queryKey: ['analyticsCacheStatus', church?.id],
    queryFn: async () => {
      if (!church?.id) return null

      const response = await fetch(`/api/analytics/cache-postgres/status?churchId=${church.id}`)
      if (!response.ok) throw new Error('Failed to fetch cache status')
      return response.json()
    },
    enabled: !!church?.id,
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  })

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/analytics/cache-postgres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId: church?.id }),
      })
      if (!response.ok) throw new Error('Failed to refresh analytics cache')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyticsCache', church?.id] })
      queryClient.invalidateQueries({ queryKey: ['analyticsCacheStatus', church?.id] })
    },
  })

  return {
    analytics: analytics as CachedAnalytics | null,
    status: status as CacheStatus | null,
    isLoading,
    error: error as Error | null,
    refreshCache: () => refreshMutation.mutateAsync(),
    isRefreshing: refreshMutation.isPending,
  }
}

/**
 * Hook to check cache status only
 */
export function useAnalyticsCacheStatus(): UseAnalyticsCacheStatusReturn {
  const { church } = useChurch()
  const queryClient = useQueryClient()
  const [lastChecked, setLastChecked] = React.useState<Date | null>(null)

  const { data: status, isLoading, error, refetch } = useQuery({
    queryKey: ['analyticsCacheStatus', church?.id],
    queryFn: async () => {
      if (!church?.id) return null

      const response = await fetch(`/api/analytics/cache-postgres/status?churchId=${church.id}`)
      if (!response.ok) throw new Error('Failed to fetch cache status')
      setLastChecked(new Date())
      return response.json()
    },
    enabled: !!church?.id,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  return {
    status: status as CacheStatus | null,
    isLoading,
    error: error as Error | null,
    refreshStatus: () => refetch().then(() => {}),
    lastChecked,
  }
}

export function useRefreshAnalyticsCache() {
  const { church } = useChurch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (forceRefresh: boolean = true) => {
      const response = await fetch('/api/analytics/cache-postgres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          churchId: church?.id,
          forceRefresh,
        }),
      })
      if (!response.ok) throw new Error('Failed to refresh analytics')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyticsCache', church?.id] })
      queryClient.invalidateQueries({ queryKey: ['analyticsCacheStatus', church?.id] })
    },
  })
}
