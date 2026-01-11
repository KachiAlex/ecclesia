'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'

import type { Survey, SurveyQuestion, SurveyResponse } from '@/types/survey'

type FormValue = string | string[] | number | boolean

interface SurveyRespondFormProps {
  survey: Survey
  existingResponse?: SurveyResponse | null
}

const isEmptyValue = (value: FormValue | undefined) => {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  return false
}

const groupQuestionsBySection = (survey: Survey) => {
  if (!survey.sections?.length) {
    return [
      {
        sectionTitle: 'Survey questions',
        sectionDescription: '',
        questions: survey.questions
      }
    ]
  }

  return survey.sections
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(section => ({
      sectionTitle: section.title,
      sectionDescription: section.description ?? '',
      questions: survey.questions.filter(question => question.sectionId === section.id)
    }))
}

export function SurveyRespondForm({ survey, existingResponse }: SurveyRespondFormProps) {
  const router = useRouter()
  const [formValues, setFormValues] = useState<Record<string, FormValue>>(() => {
    if (!existingResponse?.questionResponses?.length) {
      return {}
    }

    const initial: Record<string, FormValue> = {}
    existingResponse.questionResponses.forEach(response => {
      if (!response.questionId) return
      if (Array.isArray(response.value)) {
        initial[response.questionId] = response.value
      } else if (typeof response.value !== 'undefined' && response.value !== null) {
        initial[response.questionId] = response.value as FormValue
      } else if (response.textValue) {
        initial[response.questionId] = response.textValue
      }
    })
    return initial
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')

  const isDuplicateProtected = !survey.allowMultipleResponses && !survey.isAnonymous
  const hasLockedResponse = isDuplicateProtected && !!existingResponse

  const sections = useMemo(() => groupQuestionsBySection(survey), [survey])

  const handleValueChange = (question: SurveyQuestion, value: FormValue) => {
    setFormValues(prev => ({
      ...prev,
      [question.id]: value
    }))
    setErrors(prev => {
      const next = { ...prev }
      delete next[question.id]
      return next
    })
  }

  const toggleMultiSelect = (question: SurveyQuestion, option: string) => {
    setFormValues(prev => {
      const current = Array.isArray(prev[question.id]) ? (prev[question.id] as string[]) : []
      const exists = current.includes(option)
      const nextValue = exists ? current.filter(entry => entry !== option) : [...current, option]
      return {
        ...prev,
        [question.id]: nextValue
      }
    })
  }

  const validateForm = () => {
    const nextErrors: Record<string, string> = {}
    survey.questions.forEach(question => {
      const value = formValues[question.id]
      if (question.required && isEmptyValue(value)) {
        nextErrors[question.id] = 'This question is required'
      }
    })
    return nextErrors
  }

  const buildPayload = () => {
    return {
      responses: survey.questions
        .map(question => {
          const value = formValues[question.id]
          if (value === undefined || value === null) {
            return null
          }

          if (typeof value === 'string' && value.trim().length === 0) {
            return null
          }

          if (Array.isArray(value) && value.length === 0) {
            return null
          }

          const responsePayload: {
            questionId: string
            value: any
            textValue?: string
          } = {
            questionId: question.id,
            value
          }

          if (question.type === 'TEXT' && typeof value === 'string') {
            responsePayload.textValue = value
          }

          return responsePayload
        })
        .filter(Boolean)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (hasLockedResponse || status === 'submitting') {
      return
    }

    const nextErrors = validateForm()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setStatus('submitting')
    setServerError(null)
    try {
      const response = await fetch(`/api/surveys/${survey.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload())
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to submit response')
      }

      setStatus('success')
      router.push(`/surveys/${survey.id}`)
      router.refresh()
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Something went wrong while submitting.')
      setStatus('idle')
    }
  }

  const renderQuestionField = (question: SurveyQuestion) => {
    const value = formValues[question.id]
    const error = errors[question.id]

    switch (question.type) {
      case 'MULTIPLE_CHOICE': {
        const options = question.options?.length ? question.options : ['Option 1', 'Option 2']
        if (question.allowMultiple) {
          const selectedValues = Array.isArray(value) ? (value as string[]) : []
          return (
            <div className="space-y-2">
              {options.map(option => (
                <label key={`${question.id}-${option}`} className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-primary-200">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option)}
                    onChange={() => toggleMultiSelect(question, option)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    disabled={hasLockedResponse}
                  />
                  <span>{option}</span>
                </label>
              ))}
              {error && <p className="text-sm text-rose-600">{error}</p>}
            </div>
          )
        }

        return (
          <div className="space-y-2">
            {options.map(option => (
              <label key={`${question.id}-${option}`} className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-primary-200">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={event => handleValueChange(question, event.target.value)}
                  className="border-gray-300 text-primary-600 focus:ring-primary-500"
                  disabled={hasLockedResponse}
                />
                <span>{option}</span>
              </label>
            ))}
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>
        )
      }
      case 'TEXT': {
        if (question.textType === 'long') {
          return (
            <>
              <textarea
                value={typeof value === 'string' ? value : ''}
                onChange={event => handleValueChange(question, event.target.value)}
                rows={4}
                disabled={hasLockedResponse}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 disabled:bg-gray-50"
                placeholder="Type your response..."
              />
              {error && <p className="text-sm text-rose-600">{error}</p>}
            </>
          )
        }

        const inputType =
          question.textType === 'email'
            ? 'email'
            : question.textType === 'number'
              ? 'number'
              : 'text'

        return (
          <>
            <input
              type={inputType}
              value={typeof value === 'string' ? value : ''}
              onChange={event => handleValueChange(question, event.target.value)}
              disabled={hasLockedResponse}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 disabled:bg-gray-50"
              placeholder="Type your response..."
            />
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </>
        )
      }
      case 'RATING': {
        const min = question.minRating ?? 1
        const max = question.maxRating ?? 5
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
              <span>{question.ratingLabels?.min || 'Low'}</span>
              <div className="h-px flex-1 bg-gray-200" />
              <span>{question.ratingLabels?.max || 'High'}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={1}
              value={typeof value === 'number' ? value : Math.floor((min + max) / 2)}
              onChange={event => handleValueChange(question, Number(event.target.value))}
              disabled={hasLockedResponse}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-xs font-semibold text-gray-500">
              <span>{min}</span>
              <span>{typeof value === 'number' ? value : Math.floor((min + max) / 2)}</span>
              <span>{max}</span>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>
        )
      }
      case 'YES_NO': {
        return (
          <div className="flex flex-wrap gap-3">
            {[
              { label: question.yesNoLabels?.yes || 'Yes', value: true },
              { label: question.yesNoLabels?.no || 'No', value: false }
            ].map(choice => (
              <button
                key={`${question.id}-${choice.label}`}
                type="button"
                onClick={() => handleValueChange(question, choice.value)}
                disabled={hasLockedResponse}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  value === choice.value
                    ? 'border-primary-200 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-primary-200 hover:text-primary-700'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {choice.label}
              </button>
            ))}
            {error && <p className="w-full text-sm text-rose-600">{error}</p>}
          </div>
        )
      }
      default:
        return (
          <p className="text-sm text-gray-500">
            Unsupported question type. Please reach out to an administrator.
          </p>
        )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Respond to survey</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">{survey.title}</h1>
        {survey.description && <p className="mt-2 text-gray-600">{survey.description}</p>}
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 font-semibold">
            {survey.isAnonymous ? 'Anonymous responses' : 'Identified responses'}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 font-semibold">
            {survey.allowMultipleResponses ? 'Multiple submissions allowed' : 'One submission'}
          </span>
          {survey.deadline && (
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 font-semibold">
              Closes on {new Date(survey.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {hasLockedResponse && existingResponse && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">Thanks for responding!</p>
          <p className="mt-1 text-emerald-800">
            This survey only accepts one response per person. You can review your answers below, but further edits are disabled.
          </p>
        </div>
      )}

      {serverError && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4" />
          <p className="font-semibold">{serverError}</p>
        </div>
      )}

      <div className="space-y-6">
        {sections.map(section => (
          <section key={section.sectionTitle} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Section</p>
              <h2 className="text-xl font-semibold text-gray-900">{section.sectionTitle}</h2>
              {section.sectionDescription && <p className="text-sm text-gray-500">{section.sectionDescription}</p>}
            </div>

            <div className="space-y-6">
              {section.questions.map(question => (
                <div key={question.id} className="rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        {question.title}
                        {question.required && <span className="ml-2 text-sm font-medium text-rose-500">*</span>}
                      </p>
                      {question.description && (
                        <p className="mt-1 text-sm text-gray-500">{question.description}</p>
                      )}
                    </div>
                    <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {question.type.replace('_', ' ').toLowerCase()}
                    </span>
                  </div>
                  <div className="mt-4">{renderQuestionField(question)}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={hasLockedResponse || status === 'submitting'}
          className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Submit response
            </>
          )}
        </button>
        <Link
          href={`/surveys/${survey.id}`}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 transition hover:border-primary-200 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to details
        </Link>
      </div>
    </form>
  )
}

export default SurveyRespondForm
