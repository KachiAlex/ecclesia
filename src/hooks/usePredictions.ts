/**
 * React Hooks for ML Predictions
 * Provides easy access to machine learning prediction models
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

// ============================================================================
// Attendance Prediction Hook
// ============================================================================

export function useAttendancePrediction(
  churchId: string | null,
  eventType: string = 'SERVICE',
  daysUntilEvent: number = 30
) {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['attendance-prediction', churchId, eventType, daysUntilEvent],
    queryFn: async () => {
      if (!churchId) throw new Error('Church ID required')

      const params = new URLSearchParams({
        churchId,
        eventType,
        daysUntilEvent: String(daysUntilEvent)
      })

      const response = await fetch(`/api/ml/attendance?${params}`)

      if (!response.ok) {
        throw new Error('Failed to predict attendance')
      }

      return response.json()
    },
    enabled: !!session && !!churchId,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1
  })
}

// ============================================================================
// Giving Forecast Hook
// ============================================================================

export function useGivingForecast(
  churchId: string | null,
  period: '30-day' | '90-day' | '365-day' = '90-day'
) {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['giving-forecast', churchId, period],
    queryFn: async () => {
      if (!churchId) throw new Error('Church ID required')

      const params = new URLSearchParams({
        churchId,
        period
      })

      const response = await fetch(`/api/ml/giving-forecast?${params}`)

      if (!response.ok) {
        throw new Error('Failed to forecast giving')
      }

      return response.json()
    },
    enabled: !!session && !!churchId,
    staleTime: 1000 * 60 * 60 * 4, // 4 hours
    retry: 1
  })
}

// ============================================================================
// Member Lifecycle Prediction Hook
// ============================================================================

export function useMemberLifecyclePrediction(
  churchId: string | null,
  memberId: string | null
) {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['member-lifecycle', churchId, memberId],
    queryFn: async () => {
      if (!churchId || !memberId) throw new Error('Church ID and Member ID required')

      const params = new URLSearchParams({
        type: 'lifecycle',
        churchId,
        memberId
      })

      const response = await fetch(`/api/ml/predictions?${params}`)

      if (!response.ok) {
        throw new Error('Failed to predict member lifecycle')
      }

      return response.json()
    },
    enabled: !!session && !!churchId && !!memberId,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1
  })
}

// ============================================================================
// Churn Risk Analysis Hook
// ============================================================================

export function useChurnRiskAnalysis(
  churchId: string | null,
  options: { limit?: number } = {}
) {
  const { data: session } = useSession()
  const { limit = 50 } = options

  return useQuery({
    queryKey: ['churn-risk', churchId, limit],
    queryFn: async () => {
      if (!churchId) throw new Error('Church ID required')

      const params = new URLSearchParams({
        churchId,
        limit: String(limit)
      })

      const response = await fetch(`/api/ml/churn-risk?${params}`)

      if (!response.ok) {
        throw new Error('Failed to analyze churn risk')
      }

      return response.json()
    },
    enabled: !!session && !!churchId,
    staleTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 1
  })
}

// ============================================================================
// Sermon Optimization Hook
// ============================================================================

export function useSermonOptimization(churchId: string | null) {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['sermon-optimization', churchId],
    queryFn: async () => {
      if (!churchId) throw new Error('Church ID required')

      const params = new URLSearchParams({
        churchId
      })

      const response = await fetch(`/api/ml/sermon-optimization?${params}`)

      if (!response.ok) {
        throw new Error('Failed to optimize sermon strategy')
      }

      return response.json()
    },
    enabled: !!session && !!churchId,
    staleTime: 1000 * 60 * 60 * 4, // 4 hours
    retry: 1
  })
}

// ============================================================================
// Generic Prediction Hook (for all types)
// ============================================================================

export function usePrediction(
  type: 'attendance' | 'giving' | 'lifecycle' | 'sermon' | 'churn',
  churchId: string | null,
  options: Record<string, any> = {}
) {
  const { data: session } = useSession()

  const params = new URLSearchParams({
    type,
    churchId: churchId || '',
    ...options
  })

  return useQuery({
    queryKey: ['prediction', type, churchId, options],
    queryFn: async () => {
      if (!churchId) throw new Error('Church ID required')

      const response = await fetch(`/api/ml/predictions?${params}`)

      if (!response.ok) {
        throw new Error(`Failed to generate ${type} prediction`)
      }

      return response.json()
    },
    enabled: !!session && !!churchId,
    staleTime: 1000 * 60 * 60,
    retry: 1
  })
}

// ============================================================================
// Batch Predictions Hook (run multiple predictions at once)
// ============================================================================

export function useBatchPredictions(
  churchId: string | null,
  types: ('attendance' | 'giving' | 'churn' | 'sermon')[] = ['attendance', 'giving', 'churn']
) {
  const { data: session } = useSession()

  const queries = types.map(type =>
    useQuery({
      queryKey: ['prediction', type, churchId],
      queryFn: async () => {
        if (!churchId) throw new Error('Church ID required')

        const params = new URLSearchParams({
          type,
          churchId
        })

        const response = await fetch(`/api/ml/predictions?${params}`)

        if (!response.ok) {
          console.warn(`Failed to generate ${type} prediction`)
          return { type, data: null, error: true }
        }

        const data = await response.json()
        return { type, data, error: false }
      },
      enabled: !!session && !!churchId,
      staleTime: 1000 * 60 * 60,
      retry: 1
    })
  )

  const isLoading = queries.some(q => q.isLoading)
  const error = queries.find(q => q.error)?.error
  const data = Object.fromEntries(
    queries.map(q => [
      q.queryKey?.[1],
      q.data
    ])
  )

  return {
    data,
    isLoading,
    error,
    refetch: () => queries.forEach(q => q.refetch())
  }
}

// ============================================================================
// Refresh Mutation Hooks
// ============================================================================

export function useRefreshPredictions(churchId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (types: string[]) => {
      // Invalidate all related prediction queries
      types.forEach(type => {
        queryClient.invalidateQueries({
          queryKey: ['prediction', type, churchId]
        })
      })

      // Wait for new data to be fetched
      await Promise.all(
        types.map(type =>
          queryClient.refetchQueries({
            queryKey: ['prediction', type, churchId]
          })
        )
      )
    },
    onSuccess: () => {
      console.log('Predictions refreshed successfully')
    }
  })
}
