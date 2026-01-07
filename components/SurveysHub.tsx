'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { format } from 'date-fns'
import { BarChart4, Loader2, Plus, ShieldCheck, Users, Zap } from 'lucide-react'

import SurveyCreator from './SurveyCreator'
import { SurveyAnalyticsPanel } from './survey/SurveyAnalyticsPanel'
import { SurveyResponseFeed } from './survey/SurveyResponseFeed'
import { SurveyPreviewModal } from './survey/SurveyPreviewModal'
import { useManagedSurveys } from '@/lib/hooks/use-managed-surveys'
import { useSurveyInsights } from '@/lib/hooks/use-survey-insights'
import { useAvailableSurveys } from '@/lib/hooks/use-available-surveys'

import type { Survey } from '@/types/survey'

const statusBadgeStyles: Record<
  Survey['status'],
  { container: string; dot: string; label: string }
> = {
  DRAFT: {
    container: 'border border-gray-200 bg-gray-50 text-gray-700',
    dot: 'bg-gray-500',
    label: 'Draft'
  },
  ACTIVE: {
    container: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Active'
  },
  CLOSED: {
    container: 'border border-rose-200 bg-rose-50 text-rose-700',
    dot: 'bg-rose-500',
    label: 'Closed'
  },
  ARCHIVED: {
    container: 'border border-slate-200 bg-slate-50 text-slate-700',
    dot: 'bg-slate-500',
    label: 'Archived'
  }
}

const renderStatusBadge = (status: Survey['status']) => {
  const style = statusBadgeStyles[status] ?? statusBadgeStyles.DRAFT
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style.container}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  )
}

const getTargetSummary = (survey: Survey) => {
  switch (survey.targetAudienceType) {
    case 'ALL':
      return 'All members'
    case 'BRANCH': {
      const count = survey.targetBranchIds?.length || 0
      return `${count} branch${count === 1 ? '' : 'es'}`
    }
    case 'GROUP': {
      const count = survey.targetGroupIds?.length || 0
      return `${count} group${count === 1 ? '' : 's'}`
    }
    case 'CUSTOM': {
      const count = survey.targetUserIds?.length || 0
      return `${count} custom assignee${count === 1 ? '' : 's'}`
    }
    default:
      return survey.targetAudienceType
  }
}

interface SurveysHubProps {
  userRole: string
  canCreateSurveys: boolean
  canManageAllSurveys: boolean
  churchId?: string
}

const tabs = ['participate', 'manage', 'analytics', 'templates'] as const

type ToastState = { message: string; tone: 'success' | 'error' } | null

export default function SurveysHub({
  userRole,
  canCreateSurveys,
  canManageAllSurveys,
  churchId = ''
}: SurveysHubProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('participate')
  const [showCreator, setShowCreator] = useState(false)
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)
  const [isSavingSurvey, setIsSavingSurvey] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [previewData, setPreviewData] = useState<any | null>(null)

  const showManageTab = canCreateSurveys
  const showAnalyticsTab = canCreateSurveys
  const showTemplatesTab = canCreateSurveys

  const enableManagementFetch = (showManageTab || showAnalyticsTab) && Boolean(churchId)
  const { surveys, isLoading: isLoadingManage, refresh: refreshManaged } = useManagedSurveys(
    churchId,
    enableManagementFetch
  )
  const enableParticipateFetch = activeTab === 'participate' && Boolean(churchId)
  const {
    availableSurveys,
    isLoading: isLoadingParticipate,
    isError: isParticipateError
  } = useAvailableSurveys(churchId, enableParticipateFetch)

  useEffect(() => {
    if (!selectedSurveyId && surveys?.length) {
      setSelectedSurveyId(surveys[0].id)
    }
  }, [selectedSurveyId, surveys])

  const enableAnalytics = showAnalyticsTab && activeTab === 'analytics' && !!selectedSurveyId
  const { insights, isLoading: isLoadingInsights, isError: insightsError, error: insightsErrorObj } = useSurveyInsights({
    surveyId: selectedSurveyId || undefined,
    enabled: enableAnalytics
  })

  const handleSaveSurvey = useCallback(
    async (surveyData: any, intent: 'draft' | 'publish') => {
      if (!churchId) {
        setToast({
          message: 'Please select a church before creating surveys.',
          tone: 'error'
        })
        return
      }

      const { targetAudience, ...rest } = surveyData || {}
      const normalizedSettings = {
        ...(rest?.settings || {}),
        targetAudienceType: targetAudience?.type || 'ALL',
        targetBranchIds: targetAudience?.branchIds || [],
        targetGroupIds: targetAudience?.groupIds || [],
        targetUserIds: targetAudience?.userIds || [],
        // Legacy field support
        targetRoleIds: targetAudience?.roleIds || []
      }

      const payload = {
        ...rest,
        churchId,
        intent,
        settings: normalizedSettings
      }

      setIsSavingSurvey(true)
      try {
        const response = await fetch('/api/surveys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        const responseBody = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(responseBody?.error || 'Unable to create survey')
        }

        setToast({
          message: intent === 'publish' ? 'Survey published successfully!' : 'Survey saved as draft.',
          tone: 'success'
        })
        setShowCreator(false)
        setActiveTab(intent === 'publish' ? 'analytics' : 'manage')
        if (responseBody?.survey?.id) {
          setSelectedSurveyId(responseBody.survey.id)
        }
        await refreshManaged()
      } catch (error) {
        console.error('Error creating survey:', error)
        setToast({
          message: error instanceof Error ? error.message : 'Failed to create survey',
          tone: 'error'
        })
      } finally {
        setIsSavingSurvey(false)
      }
    },
    [churchId, refreshManaged]
  )

  const handlePreviewSurvey = (surveyData: any) => {
    setPreviewData(surveyData)
  }

  const publishSurvey = useCallback(async (surveyId: string) => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}/publish`, {
        method: 'POST'
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Unable to publish survey')
      }
      setToast({ message: 'Survey published successfully!', tone: 'success' })
      await refreshManaged()
    } catch (error) {
      console.error('Error publishing survey:', error)
      setToast({
        message: error instanceof Error ? error.message : 'Failed to publish survey',
        tone: 'error'
      })
    }
  }, [refreshManaged])

  const closeSurvey = useCallback(async (surveyId: string) => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}/close`, {
        method: 'POST'
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Unable to close survey')
      }
      setToast({ message: 'Survey closed successfully.', tone: 'success' })
      await refreshManaged()
    } catch (error) {
      console.error('Error closing survey:', error)
      setToast({
        message: error instanceof Error ? error.message : 'Failed to close survey',
        tone: 'error'
      })
    }
  }, [refreshManaged])

  const managedEmptyState = !isLoadingManage && (!surveys || surveys.length === 0)
  const selectedSurvey = useMemo(
    () => surveys?.find((survey: Survey) => survey.id === selectedSurveyId) || null,
    [surveys, selectedSurveyId]
  )

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.tone === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            className="text-white/80 transition hover:text-white"
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Surveys</h1>
        <p className="text-gray-600 mt-1">
          {canCreateSurveys
            ? 'Create surveys and gather feedback from your congregation.'
            : 'Participate in surveys and provide your feedback.'
          }
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border p-2 flex gap-2 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('participate')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'participate'
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          }`}
        >
          My Surveys
        </button>

        {showManageTab && (
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'manage'
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-white text-gray-900 hover:bg-gray-100'
            }`}
          >
            Manage
          </button>
        )}

        {showAnalyticsTab && (
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'analytics'
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-white text-gray-900 hover:bg-gray-100'
            }`}
          >
            Analytics
          </button>
        )}

        {showTemplatesTab && (
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'templates'
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-white text-gray-900 hover:bg-gray-100'
            }`}
          >
            Templates
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border p-6">
        {activeTab === 'participate' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Available Surveys</h2>
              <p className="text-sm text-gray-500">
                These surveys are targeted to you based on your branch, groups, or custom assignments.
              </p>
            </div>

            {isLoadingParticipate && (
              <div className="flex items-center gap-3 rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                Checking for new surveys...
              </div>
            )}

            {isParticipateError && !isLoadingParticipate && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p className="font-semibold">Unable to load surveys</p>
                <p>Please refresh the page or try again later.</p>
              </div>
            )}

            {!isLoadingParticipate && !isParticipateError && (!availableSurveys || availableSurveys.length === 0) && (
              <div className="rounded-2xl border border-dashed bg-gray-50 p-6 text-center text-gray-500">
                <p className="font-medium text-gray-900">No surveys yet</p>
                <p className="text-sm">You’ll see surveys here once an admin publishes one for you.</p>
              </div>
            )}

            {availableSurveys && availableSurveys.length > 0 && (
              <ul className="space-y-3">
                {availableSurveys.map((survey) => (
                  <li key={survey.id} className="rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{survey.title}</p>
                        <p className="text-sm text-gray-500">
                          {survey.description || 'No description provided.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-600">
                          <Users className="h-3.5 w-3.5" />
                          {survey.targetAudienceType.toLowerCase()}
                        </span>
                        {survey.deadline && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 font-medium text-amber-700">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Due {format(new Date(survey.deadline), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                      >
                        Respond now
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:border-primary-200 hover:text-primary-700"
                      >
                        View details
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'manage' && canCreateSurveys && (
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Survey Management</h2>
                <p className="text-sm text-gray-500">Draft, publish, and monitor the surveys you created.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreator(true)}
                disabled={isSavingSurvey}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {isSavingSurvey ? 'Saving...' : 'Create Survey'}
              </button>
            </div>

            {isLoadingManage && (
              <div className="flex items-center gap-3 rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                Loading your surveys...
              </div>
            )}

            {managedEmptyState && !isLoadingManage && (
              <div className="rounded-2xl border border-dashed bg-gray-50 p-6 text-center text-gray-500">
                <p className="font-medium text-gray-900">No surveys yet</p>
                <p className="text-sm">Create your first survey to start collecting insight from your congregation.</p>
              </div>
            )}

            {!managedEmptyState && !isLoadingManage && surveys && (
              <ul className="space-y-3">
                {surveys.map((survey: Survey) => (
                  <li
                    key={survey.id}
                    className={`rounded-2xl border p-4 shadow-sm transition ${
                      selectedSurveyId === survey.id ? 'border-primary-200 ring-2 ring-primary-100' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-gray-900">{survey.title}</p>
                          {renderStatusBadge(survey.status)}
                        </div>
                        <p className="text-sm text-gray-500">
                          {survey.responseCount || 0} responses • Target: {getTargetSummary(survey)}
                        </p>
                        {survey.deadline && (
                          <p className="text-xs text-gray-400">
                            Closes {format(new Date(survey.deadline), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      {survey.publishedAt && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Published {format(new Date(survey.publishedAt), 'MMM d')}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-primary-300 hover:text-primary-700"
                        onClick={() => setSelectedSurveyId(survey.id)}
                      >
                        <BarChart4 className="h-4 w-4" />
                        View analytics
                      </button>
                      {survey.status === 'DRAFT' && (
                        <button
                          type="button"
                          onClick={() => publishSurvey(survey.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-primary-700 hover:border-primary-300"
                        >
                          <Zap className="h-4 w-4" />
                          Publish survey
                        </button>
                      )}
                      {survey.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => closeSurvey(survey.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:border-rose-300"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Close survey
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'analytics' && canCreateSurveys && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Survey Analytics</h2>
                <p className="text-sm text-gray-500">
                  Explore response trends, question-level insights, and individual feedback.
                </p>
              </div>
            </div>

            {managedEmptyState && (
              <div className="rounded-2xl border border-dashed bg-gray-50 p-6 text-center text-gray-500">
                <p className="font-medium text-gray-900">No surveys to analyze</p>
                <p className="text-sm">Create a survey first, then come back to review the responses.</p>
              </div>
            )}

            {!managedEmptyState && (
              <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                <aside className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Your surveys</p>
                  <div className="space-y-2">
                    {surveys?.map((survey: Survey) => {
                      const isActive = survey.id === selectedSurveyId
                      return (
                        <button
                          key={survey.id}
                          type="button"
                          onClick={() => setSelectedSurveyId(survey.id)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                            isActive
                              ? 'border-primary-200 bg-primary-50 text-primary-900 shadow-sm'
                              : 'border-gray-100 hover:border-primary-100 hover:bg-gray-50'
                          }`}
                        >
                          <p className="text-sm font-semibold">{survey.title}</p>
                          <p className="text-xs text-gray-500">
                            {survey.responseCount || 0} responses · {survey.status.toLowerCase()}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </aside>

                <section className="space-y-6">
                  {!selectedSurvey && (
                    <div className="rounded-2xl border border-dashed bg-gray-50 p-6 text-center text-gray-500">
                      <p className="font-medium text-gray-900">Select a survey</p>
                      <p className="text-sm">Pick any survey on the left to view its analytics.</p>
                    </div>
                  )}

                  {selectedSurvey && enableAnalytics && isLoadingInsights && (
                    <div className="flex items-center gap-3 rounded-2xl border bg-white p-4 text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                      Loading analytics for {selectedSurvey.title}...
                    </div>
                  )}

                  {selectedSurvey && enableAnalytics && insightsError && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                      <p className="font-semibold">Unable to load analytics</p>
                      <p>{insightsErrorObj?.message || 'Please try again later.'}</p>
                    </div>
                  )}

                  {selectedSurvey && insights && !isLoadingInsights && !insightsError && (
                    <div className="space-y-6">
                      <div className="rounded-2xl border bg-white p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="text-lg font-semibold text-gray-900">{selectedSurvey.title}</p>
                            <p className="text-sm text-gray-500">
                              {selectedSurvey.responseCount || 0} responses • Target: {getTargetSummary(selectedSurvey)}
                            </p>
                          </div>
                          {renderStatusBadge(selectedSurvey.status)}
                        </div>
                        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                          <div className="rounded-xl bg-gray-50 p-4">
                            <dt className="text-xs font-semibold uppercase text-gray-500">Deadline</dt>
                            <dd className="text-sm text-gray-900">
                              {selectedSurvey.deadline ? format(new Date(selectedSurvey.deadline), 'MMM d, yyyy') : 'No deadline'}
                            </dd>
                          </div>
                          <div className="rounded-xl bg-gray-50 p-4">
                            <dt className="text-xs font-semibold uppercase text-gray-500">Audience</dt>
                            <dd className="text-sm text-gray-900">{getTargetSummary(selectedSurvey)}</dd>
                          </div>
                          <div className="rounded-xl bg-gray-50 p-4">
                            <dt className="text-xs font-semibold uppercase text-gray-500">Published</dt>
                            <dd className="text-sm text-gray-900">
                              {selectedSurvey.publishedAt ? format(new Date(selectedSurvey.publishedAt), 'MMM d, yyyy') : 'Draft'}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <SurveyAnalyticsPanel insights={insights} />
                      <div className="rounded-3xl border bg-white shadow-sm ring-1 ring-black/5">
                        <div className="border-b border-gray-100 px-6 py-4">
                          <p className="text-lg font-semibold text-gray-900">Response feed</p>
                          <p className="text-sm text-gray-500">
                            Most recent answers for <span className="font-medium">{selectedSurvey.title}</span>
                          </p>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-primary-200 hover:text-primary-700"
                          >
                            <BarChart4 className="h-3.5 w-3.5" />
                            Export CSV
                          </button>
                        </div>
                        <SurveyResponseFeed insights={insights} />
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && canCreateSurveys && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Survey Templates</h2>
            <div className="text-gray-600">
              <p>Survey templates will be available here.</p>
              <p className="text-sm mt-2">
                Use pre-built templates to quickly create common types of surveys.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}