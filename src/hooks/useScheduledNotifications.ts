/**
 * React Hooks for Scheduled Notifications
 * Integration layer for scheduled notifications with React Query
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ScheduledNotification,
  ScheduledNotificationCreateInput,
  ScheduledNotificationUpdateInput,
  ScheduledNotificationRun,
} from './types'
import { useAuth } from '@/hooks/useAuth'
import { useChurch } from '@/hooks/useChurch'

interface UseScheduledNotificationsReturn {
  notifications: ScheduledNotification[]
  isLoading: boolean
  error: Error | null
  createNotification: (input: ScheduledNotificationCreateInput) => Promise<ScheduledNotification>
  updateNotification: (id: string, updates: ScheduledNotificationUpdateInput) => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refreshNotifications: () => void
}

interface UseScheduledNotificationRunsReturn {
  runs: ScheduledNotificationRun[]
  isLoading: boolean
  error: Error | null
  refreshRuns: () => void
}

/**
 * Hook to manage scheduled notifications
 */
export function useScheduledNotifications(): UseScheduledNotificationsReturn {
  const { session } = useAuth()
  const { church } = useChurch()
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading, error, refetch } = useQuery({
    queryKey: ['scheduledNotifications', church?.id],
    queryFn: async () => {
      if (!church?.id) return []

      const response = await fetch(`/api/notifications/scheduled?churchId=${church.id}`)
      if (!response.ok) throw new Error('Failed to fetch scheduled notifications')
      return response.json()
    },
    enabled: !!church?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  })

  const createMutation = useMutation({
    mutationFn: async (input: ScheduledNotificationCreateInput) => {
      const response = await fetch('/api/notifications/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          churchId: church?.id,
        }),
      })
      if (!response.ok) throw new Error('Failed to create scheduled notification')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledNotifications', church?.id] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ScheduledNotificationUpdateInput }) => {
      const response = await fetch(`/api/notifications/scheduled/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Failed to update scheduled notification')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledNotifications', church?.id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notifications/scheduled/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete scheduled notification')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledNotifications', church?.id] })
    },
  })

  return {
    notifications,
    isLoading,
    error: error as Error | null,
    createNotification: (input) => createMutation.mutateAsync(input),
    updateNotification: (id, updates) => updateMutation.mutateAsync({ id, updates }),
    deleteNotification: (id) => deleteMutation.mutateAsync(id),
    refreshNotifications: () => refetch(),
  }
}

/**
 * Hook to fetch scheduled notification runs
 */
export function useScheduledNotificationRuns(
  notificationId: string | null
): UseScheduledNotificationRunsReturn {
  const { data: runs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['scheduledNotificationRuns', notificationId],
    queryFn: async () => {
      if (!notificationId) return []

      const response = await fetch(`/api/notifications/scheduled/${notificationId}/runs`)
      if (!response.ok) throw new Error('Failed to fetch notification runs')
      return response.json()
    },
    enabled: !!notificationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    runs,
    isLoading,
    error: error as Error | null,
    refreshRuns: () => refetch(),
  }
}

/**
 * Hook to trigger a scheduled notification immediately
 */
export function useTriggerScheduledNotification() {
  const queryClient = useQueryClient()
  const { church } = useChurch()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/scheduled/${notificationId}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to trigger notification')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledNotificationRuns'] })
    },
  })
}

/**
 * Hook to manage digest configuration
 */
export function useSaveDigestConfig() {
  const { church } = useChurch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ notificationId, ...config }: any) => {
      const response = await fetch(`/api/notifications/scheduled/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digestConfig: config }),
      })
      if (!response.ok) throw new Error('Failed to save digest config')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledNotifications', church?.id] })
    },
  })
}
