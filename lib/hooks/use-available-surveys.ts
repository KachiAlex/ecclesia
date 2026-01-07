'use client'

import useSWR from 'swr'
import type { Survey } from '@/types/survey'

const fetcher = async (url: string): Promise<Survey[]> => {
  const res = await fetch(url)
  const payload = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(payload.error || 'Failed to load surveys')
  }

  return (payload.surveys || []) as Survey[]
}

export function useAvailableSurveys(churchId?: string, enabled = true) {
  const shouldFetch = Boolean(churchId && enabled)

  const { data, error, isLoading, mutate } = useSWR<Survey[]>(
    shouldFetch ? `/api/surveys?churchId=${churchId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    availableSurveys: data,
    isLoading,
    isError: Boolean(error),
    error,
    refresh: mutate
  }
}
