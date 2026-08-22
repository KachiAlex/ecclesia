'use client'

import { Fragment } from 'react'
import { TrendingUp, UsersRound, Activity, Target } from 'lucide-react'
import { format } from 'date-fns'

import type {
  SurveyInsights,
  SurveyQuestionAnalytics,
  SurveyResponseBreakdown
} from '@/types/survey'

interface SurveyAnalyticsPanelProps {
  insights: SurveyInsights
}

export function SurveyAnalyticsPanel({ insights }: SurveyAnalyticsPanelProps) {
  const { analytics } = insights

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {analyticsCards(analytics).map(card => (
          <div
            key={card.label}
            className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <card.icon className="h-4 w-4 text-primary-500" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-gray-900">{card.value}</p>
            {card.subLabel && <p className="text-xs text-gray-500">{card.subLabel}</p>}
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TrendPanel analytics={analytics} />
        <QuestionBreakdowns questionAnalytics={analytics.questionAnalytics} />
      </section>
    </div>
  )
}

function TrendPanel({ analytics }: { analytics: SurveyInsights['analytics'] }) {
  const points = analytics.responseTrend
  const maxCount = Math.max(...points.map(point => point.count), 1)

  const getY = (count: number) => 100 - (count / maxCount) * 100
  const getX = (index: number) => (index / Math.max(points.length - 1, 1)) * 100

  const polylinePoints = points
    .map((point, index) => `${getX(index)},${getY(point.count)}`)
    .join(' ')

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-black/5 lg:col-span-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Response trend</p>
          <p className="text-xs text-gray-500">Daily submissions</p>
        </div>
        <TrendingUp className="h-4 w-4 text-primary-500" />
      </div>

      {points.length ? (
        <div className="mt-6">
          <svg viewBox="0 0 100 100" className="h-32 w-full">
            <defs>
              <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#728CFB" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#728CFB" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke="#4F46E5"
              strokeWidth="2"
              points={polylinePoints}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <polygon
              fill="url(#trendFill)"
              points={`${polylinePoints} ${getX(points.length - 1)},100 0,100`}
            />
          </svg>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-500">
            {points.slice(0, 3).map(point => (
              <div key={point.date}>
                <p className="font-medium text-gray-900">{point.count}</p>
                <p>{format(new Date(point.date), 'MMM d')}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-gray-500">No responses yet.</p>
      )}
    </div>
  )
}

function QuestionBreakdowns({
  questionAnalytics
}: {
  questionAnalytics: SurveyQuestionAnalytics[]
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5 lg:col-span-2">
      <div className="flex items-center justify-between px-2 pb-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Question insights</p>
          <p className="text-xs text-gray-500">Breakdown of responses per question</p>
        </div>
        <Target className="h-4 w-4 text-primary-500" />
      </div>

      <div className="space-y-6">
        {questionAnalytics.map(question => (
          <article key={question.questionId} className="space-y-3 rounded-xl border bg-gray-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{question.questionTitle}</p>
                <p className="text-xs text-gray-500 capitalize">{question.questionType.toLowerCase()}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600">
                {question.totalResponses} response{question.totalResponses === 1 ? '' : 's'}
              </span>
            </div>
            <QuestionBreakdown question={question} />
          </article>
        ))}
      </div>
    </div>
  )
}

function QuestionBreakdown({ question }: { question: SurveyQuestionAnalytics }) {
  const breakdown = question.responseBreakdown || ({} as SurveyResponseBreakdown)

  switch (question.questionType) {
    case 'MULTIPLE_CHOICE':
      return (
        <div className="space-y-2">
          {Object.entries(breakdown.optionCounts || {})
            .sort(([, a], [, b]) => Number(b) - Number(a))
            .map(([option, count]) => (
              <div key={option}>
                <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                  <span>{option}</span>
                  <span>{count}</span>
                </div>
                <Progress value={question.totalResponses ? (count / question.totalResponses) * 100 : 0} />
              </div>
            ))}
        </div>
      )
    case 'RATING':
      return (
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-500">Average rating</p>
            <p className="text-2xl font-semibold text-gray-900">
              {breakdown.averageRating ? breakdown.averageRating.toFixed(1) : '—'}
            </p>
          </div>
          <div className="flex-1">
            <div className="flex h-6 overflow-hidden rounded-full bg-white ring-1 ring-gray-200">
              {Object.keys(breakdown.ratingDistribution || {})
                .sort((a, b) => Number(a) - Number(b))
                .map(rating => {
                  const count = breakdown.ratingDistribution?.[Number(rating)] ?? 0
                  const percent = question.totalResponses
                    ? Math.max((count / question.totalResponses) * 100, 4)
                    : 0
                  return (
                    <span
                      key={rating}
                      className="flex items-center justify-center text-[10px] font-medium text-gray-700"
                      style={{ width: `${percent}%`, backgroundColor: 'rgba(79,70,229,0.1)' }}
                    >
                      {rating}
                    </span>
                  )
                })}
            </div>
          </div>
        </div>
      )
    case 'YES_NO':
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Yes</p>
            <p className="text-lg font-semibold text-gray-900">{breakdown.yesCount ?? 0}</p>
            <Progress
              value={
                question.totalResponses ? ((breakdown.yesCount ?? 0) / question.totalResponses) * 100 : 0
              }
              variant="success"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500">No</p>
            <p className="text-lg font-semibold text-gray-900">{breakdown.noCount ?? 0}</p>
            <Progress
              value={
                question.totalResponses ? ((breakdown.noCount ?? 0) / question.totalResponses) * 100 : 0
              }
              variant="danger"
            />
          </div>
        </div>
      )
    case 'TEXT':
      return (
        <div className="space-y-2">
          {(breakdown.textResponses || []).slice(0, 3).map((text, index) => (
            <Fragment key={text + index}>
              <p className="rounded-xl bg-white p-3 text-sm text-gray-700 shadow-sm">{text}</p>
            </Fragment>
          ))}
          {(breakdown.textResponses?.length || 0) > 3 && (
            <p className="text-xs text-gray-500">
              +{(breakdown.textResponses?.length || 0) - 3} more responses
            </p>
          )}
          {!breakdown.textResponses?.length && (
            <p className="text-sm italic text-gray-400">No written responses yet.</p>
          )}
        </div>
      )
    default:
      return <p className="text-sm text-gray-500">No data for this question type.</p>
  }
}

function Progress({ value, variant = 'primary' }: { value: number; variant?: 'primary' | 'success' | 'danger' }) {
  const colorMap: Record<typeof variant, string> = {
    primary: 'bg-primary-500',
    success: 'bg-emerald-500',
    danger: 'bg-rose-500'
  }

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white ring-1 ring-gray-200">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorMap[variant]}`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  )
}

function analyticsCards(analytics: SurveyInsights['analytics']) {
  return [
    {
      label: 'Total responses',
      value: analytics.totalResponses,
      icon: UsersRound
    },
    {
      label: 'Completion rate',
      value: `${analytics.completionRate.toFixed(0)}%`,
      icon: Activity,
      subLabel: analytics.uniqueRespondents ? `${analytics.uniqueRespondents} unique respondents` : undefined
    },
    {
      label: 'First response',
      value: analytics.firstResponseAt ? format(new Date(analytics.firstResponseAt), 'MMM d, h:mma') : '—',
      icon: Target,
      subLabel: analytics.lastResponseAt ? `Last ${format(new Date(analytics.lastResponseAt), 'MMM d, h:mma')}` : undefined
    },
    {
      label: 'Trend momentum',
      value: analytics.responseTrend.slice(-3).reduce((acc, point) => acc + point.count, 0),
      icon: TrendingUp,
      subLabel: 'Responses in last 3 days'
    }
  ]
}
