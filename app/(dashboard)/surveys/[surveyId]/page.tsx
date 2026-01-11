import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { format } from 'date-fns'
import { ArrowLeft, CalendarClock, MessageSquare, ShieldCheck, Users } from 'lucide-react'

import { authOptions } from '@/lib/auth-options'
import { SurveyService } from '@/lib/services/survey-service'
import type { Survey } from '@/types/survey'

interface SurveyDetailRouteProps {
  params: { surveyId: string }
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
      return `${count} assignee${count === 1 ? '' : 's'}`
    }
    default:
      return survey.targetAudienceType
  }
}

const statusCopy: Record<
  Survey['status'],
  { label: string; badge: string }
> = {
  DRAFT: {
    label: 'Draft',
    badge: 'bg-gray-100 text-gray-700 border border-gray-200'
  },
  ACTIVE: {
    label: 'Active',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  },
  CLOSED: {
    label: 'Closed',
    badge: 'bg-rose-50 text-rose-700 border border-rose-200'
  },
  ARCHIVED: {
    label: 'Archived',
    badge: 'bg-slate-50 text-slate-700 border border-slate-200'
  }
}

export default async function SurveyDetailRoute({ params }: SurveyDetailRouteProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/auth/login')
  }

  const survey = await SurveyService.getSurveyById(params.surveyId, session.user.id)
  if (!survey) {
    redirect('/surveys')
  }

  const now = new Date()
  const isRespondWindowOpen =
    survey.status === 'ACTIVE' && (!survey.deadline || now <= new Date(survey.deadline))
  const existingResponse = survey.responses?.[0]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link
          href="/surveys"
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 font-medium text-gray-600 hover:border-primary-200 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to surveys
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-900">{survey.title}</span>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Survey overview</p>
            <h1 className="text-3xl font-bold text-gray-900">{survey.title}</h1>
            {survey.description && <p className="text-base text-gray-600">{survey.description}</p>}
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${statusCopy[survey.status].badge}`}>
                <ShieldCheck className="h-4 w-4" />
                {statusCopy[survey.status].label}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 font-semibold">
                <Users className="h-4 w-4" />
                {getTargetSummary(survey)}
              </span>
              {survey.deadline && (
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 font-semibold">
                  <CalendarClock className="h-4 w-4" />
                  Closes {format(new Date(survey.deadline), 'MMM d, yyyy')}
                </span>
              )}
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 font-semibold">
                <MessageSquare className="h-4 w-4" />
                {survey.responseCount || 0} responses
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            {isRespondWindowOpen ? (
              <Link
                href={`/surveys/${survey.id}/respond`}
                className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
              >
                Respond now
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-500"
              >
                Responses closed
              </button>
            )}
            {existingResponse && (
              <p className="text-sm text-emerald-700">
                You submitted a response on{' '}
                {format(new Date(existingResponse.submittedAt), 'MMM d, yyyy • h:mmaaa')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Survey structure</h2>
        <p className="text-sm text-gray-500">Preview of the questions your congregation will answer.</p>
        <div className="mt-6 space-y-6">
          {(survey.sections?.length ? survey.sections : [{ id: 'default', title: 'Questions', order: 0 }]).map(
            (section) => {
              const sectionQuestions = survey.questions.filter((question) =>
                survey.sections?.length ? question.sectionId === section.id : true
              )

              if (!sectionQuestions.length) {
                return null
              }

              return (
                <section key={section.id} className="rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Section</p>
                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                    {section.description && (
                      <p className="text-sm text-gray-500">{section.description}</p>
                    )}
                  </div>
                  <ul className="space-y-4">
                    {sectionQuestions.map((question) => (
                      <li key={question.id} className="rounded-xl border border-dashed border-gray-200 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {question.title}
                              {question.required && <span className="ml-2 text-rose-500">*</span>}
                            </p>
                            {question.description && (
                              <p className="text-sm text-gray-500">{question.description}</p>
                            )}
                          </div>
                          <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {question.type.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            }
          )}
        </div>
      </div>
    </div>
  )
}
