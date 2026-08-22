'use client'

import { Fragment, useMemo } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Users, ShieldCheck, Eye } from 'lucide-react'

import type { SurveyQuestion, SurveySection, TargetAudience } from '@/types/survey'
import type { SurveySettingsFormState } from '@/components/SurveySettings'

interface SurveyPreviewModalProps {
  open: boolean
  onClose: () => void
  data: {
    title: string
    description?: string
    questions: SurveyQuestion[]
    sections: SurveySection[]
    settings: SurveySettingsFormState
    targetAudience: TargetAudience
  }
}

const getSectionFallback = (): SurveySection => ({
  id: 'preview-section',
  title: 'Survey',
  description: '',
  order: 0
})

const getTargetSummary = (audience: TargetAudience) => {
  switch (audience.type) {
    case 'ALL':
      return 'All members'
    case 'BRANCH':
      return `${audience.branchIds?.length || 0} branch${audience.branchIds?.length === 1 ? '' : 'es'}`
    case 'GROUP':
      return `${audience.groupIds?.length || 0} group${audience.groupIds?.length === 1 ? '' : 's'}`
    case 'CUSTOM': {
      const peopleCount = (audience.userIds?.length || 0) || (audience.roleIds?.length || 0)
      return peopleCount > 0 ? `${peopleCount} selected people` : 'Custom selection'
    }
    default:
      return 'Custom'
  }
}

const renderQuestionPreview = (question: SurveyQuestion) => {
  switch (question.type) {
    case 'MULTIPLE_CHOICE': {
      const allowMultiple = question.allowMultiple
      const options = question.options?.length ? question.options : ['Option 1', 'Option 2']
      return (
        <div className="space-y-2">
          {options.map((option, idx) => (
            <label key={`${question.id}-option-${idx}`} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type={allowMultiple ? 'checkbox' : 'radio'}
                disabled
                className="rounded border-gray-300 text-primary-600"
              />
              {option || `Option ${idx + 1}`}
            </label>
          ))}
        </div>
      )
    }
    case 'TEXT':
      return (
        <textarea
          disabled
          rows={question.textType === 'long' ? 4 : 2}
          className="mt-2 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          placeholder="Response preview"
        />
      )
    case 'RATING': {
      const min = question.minRating ?? 1
      const max = question.maxRating ?? 5
      const values = Array.from({ length: max - min + 1 }, (_, idx) => min + idx)
      return (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <button
              key={`${question.id}-rating-${value}`}
              type="button"
              disabled
              className="h-8 w-8 rounded-full border border-gray-300 text-sm font-semibold text-gray-600"
            >
              {value}
            </button>
          ))}
        </div>
      )
    }
    case 'YES_NO':
      return (
        <div className="flex gap-3">
          {['Yes', 'No'].map((label) => (
            <button
              key={`${question.id}-${label}`}
              type="button"
              disabled
              className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-semibold text-gray-500"
            >
              {label}
            </button>
          ))}
        </div>
      )
    default:
      return null
  }
}

export function SurveyPreviewModal({ open, onClose, data }: SurveyPreviewModalProps) {
  const { title, description, questions, sections, settings, targetAudience } = data

  const orderedSections = useMemo(() => {
    if (!sections?.length) {
      return [getSectionFallback()]
    }
    return [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [sections])

  const questionsBySection = useMemo(() => {
    const fallbackSectionId = orderedSections[0]?.id
    return orderedSections.map((section) => ({
      section,
      questions: questions
        .filter((question) => (question.sectionId || fallbackSectionId) === section.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }))
  }, [orderedSections, questions])

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Preview mode</p>
                    <Dialog.Title className="text-lg font-semibold text-gray-900">{title || 'Untitled survey'}</Dialog.Title>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-gray-200 p-2 text-gray-500 hover:text-gray-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-6 bg-gray-50/60 p-6 md:grid-cols-[280px_1fr]">
                  <aside className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="rounded-xl bg-primary-50 p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-primary-900">
                        <Users className="h-4 w-4 text-primary-500" />
                        Audience
                      </div>
                      <p className="mt-1 text-xs text-primary-800">{getTargetSummary(targetAudience)}</p>
                    </div>
                    <div className="space-y-2 text-xs text-gray-600">
                      <p className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        {settings.isAnonymous ? 'Anonymous responses' : 'Names collected'}
                      </p>
                      <p>{settings.allowMultipleResponses ? 'Multiple responses allowed' : 'Single response only'}</p>
                      {settings.deadline && (
                        <p>
                          Closes on{' '}
                          {new Date(settings.deadline).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}{' '}
                          at{' '}
                          {new Date(settings.deadline).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                      <p>{settings.sendReminders ? 'Reminder nudges enabled' : 'No reminders configured'}</p>
                    </div>
                  </aside>

                  <section className="space-y-6 rounded-3xl bg-white p-6 shadow-lg">
                    {description && (
                      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                        {description}
                      </div>
                    )}

                    {questionsBySection.map(({ section, questions: scopedQuestions }) => (
                      <div key={section.id} className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                            {section.title}
                          </p>
                          {section.description && (
                            <p className="text-xs text-gray-500">{section.description}</p>
                          )}
                        </div>

                        <div className="space-y-4">
                          {scopedQuestions.length === 0 && (
                            <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                              No questions in this section yet.
                            </div>
                          )}
                          {scopedQuestions.map((question) => (
                            <div key={question.id} className="rounded-2xl border border-gray-100 p-4 shadow-sm">
                              <div className="flex items-start gap-2">
                                <Eye className="mt-1 h-4 w-4 text-primary-500" />
                                <div className="flex-1 space-y-2">
                                  <div>
                                    <p className="font-semibold text-gray-900">
                                      {question.title || 'Untitled question'}
                                      {question.required && <span className="ml-1 text-xs text-rose-500">*</span>}
                                    </p>
                                    {question.description && (
                                      <p className="text-sm text-gray-500">{question.description}</p>
                                    )}
                                  </div>
                                  {renderQuestionPreview(question)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
