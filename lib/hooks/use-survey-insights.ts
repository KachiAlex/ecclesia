import useSWR from 'swr'

import type { SurveyInsights } from '@/types/survey'

interface UseSurveyInsightsOptions {
  surveyId?: string
  enabled?: boolean
}

const fetcher = async (url: string): Promise<SurveyInsights> => {
  const res = await fetch(url)
  const payload = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(payload.error || 'Failed to load survey insights')
  }

  return payload.insights as SurveyInsights
}

export function useSurveyInsights({ surveyId, enabled = true }: UseSurveyInsightsOptions) {
  const shouldFetch = Boolean(surveyId && enabled)
  const { data, error, isLoading, mutate } = useSWR<SurveyInsights>(
    shouldFetch ? `/api/surveys/${surveyId}/insights` : null,
    fetcher,
    {
      revalidateOnFocus: false
    }
  )

  return {
    insights: data,
    isLoading,
    isError: Boolean(error),
    error,
    refresh: mutate
  }
}
