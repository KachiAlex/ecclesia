'use client'

import { memo, useMemo } from 'react'
import { MessageSquareMore, UserRound, Clock3, Quote, Sparkles } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import type { SurveyInsights, SurveyResponse } from '@/types/survey'

interface SurveyResponseFeedProps {
  insights: SurveyInsights
  limit?: number
}

export function SurveyResponseFeed({ insights, limit = 25 }: SurveyResponseFeedProps) {
  const responses = useMemo(() => insights.responses.slice(0, limit), [insights.responses, limit])
  const { survey } = insights

  if (!responses.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white/60 p-8 text-center text-gray-500">
        <MessageSquareMore className="mb-3 h-10 w-10 text-primary-400" />
        <p className="text-base font-semibold text-gray-900">No responses logged yet</p>
        <p className="text-sm text-gray-500">
          As soon as people answer <span className="font-medium">{survey.title}</span>, their feedback will flow in
          here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {responses.map(response => (
        <ResponseCard key={response.id} response={response} isAnonymous={survey.isAnonymous} />
      ))}
    </div>
  )
}

interface ResponseCardProps {
  response: SurveyResponse
  isAnonymous: boolean
}

const ResponseCard = memo(function ResponseCard({ response, isAnonymous }: ResponseCardProps) {
  const responderName = !isAnonymous && response.user
    ? `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim() || response.user.email || 'Respondent'
    : 'Anonymous respondent'

  const submittedAgo = formatDistanceToNow(new Date(response.submittedAt), { addSuffix: true })

  return (
    <article className="rounded-2xl border bg-white/90 p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserBadge name={responderName} anonymous={isAnonymous} />
          <div>
            <p className="text-sm font-semibold text-gray-900">{responderName}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock3 className="h-3 w-3 text-primary-400" />
              {submittedAgo}
            </p>
          </div>
        </div>
        {response.userAgent && (
          <p className="text-[11px] uppercase tracking-wide text-gray-400">{response.userAgent.split(' ')[0]}</p>
        )}
      </header>

      <section className="mt-4 space-y-3">
        {response.questionResponses.map(question => (
          <div key={question.id} className="rounded-xl bg-gray-50/80 p-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{question.question?.title}</p>
            <ResponseValue value={question.value} textValue={question.textValue} />
          </div>
        ))}
      </section>
    </article>
  )
})

function ResponseValue({ value, textValue }: { value: any; textValue?: string | null }) {
  if (Array.isArray(value)) {
    return (
      <div className="mt-1 flex flex-wrap gap-2">
        {value.map((entry: string) => (
          <span key={entry} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
            {entry}
          </span>
        ))}
      </div>
    )
  }

  if (typeof value === 'boolean') {
    return (
      <p className={`mt-1 inline-flex items-center gap-1 text-sm font-semibold ${value ? 'text-emerald-600' : 'text-rose-600'}`}>
        <Sparkles className="h-3.5 w-3.5" />
        {value ? 'Yes' : 'No'}
      </p>
    )
  }

  if (typeof value === 'number') {
    return (
      <p className="mt-1 text-xl font-semibold text-gray-900">
        {value}
        <span className="ml-1 text-xs font-medium text-gray-500">/10</span>
      </p>
    )
  }

  const text = typeof value === 'string' && value.trim().length ? value : textValue

  if (text) {
    return (
      <blockquote className="mt-1 flex items-start gap-2 text-sm text-gray-700">
        <Quote className="h-4 w-4 text-primary-400" />
        <p>{text}</p>
      </blockquote>
    )
  }

  return <p className="mt-1 text-sm text-gray-400 italic">No answer provided.</p>
}

function UserBadge({ name, anonymous }: { name: string; anonymous: boolean }) {
  const initials = useMemo(() => {
    if (anonymous) return '??'
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase()
  }, [name, anonymous])

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-indigo-500 text-sm font-semibold text-white shadow-inner">
      {initials}
    </div>
  )
}
