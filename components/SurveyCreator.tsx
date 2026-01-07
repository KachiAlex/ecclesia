'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { GripVertical, Settings, Users, Save, Eye, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { SurveyQuestion, QuestionType, TargetAudience, SurveySection } from '@/types/survey'

import MultipleChoiceQuestion from './survey/MultipleChoiceQuestion'
import TextQuestion from './survey/TextQuestion'
import RatingQuestion from './survey/RatingQuestion'
import YesNoQuestion from './survey/YesNoQuestion'
import SurveySettings from './SurveySettings'
import TargetAudienceSelector from './survey/TargetAudienceSelector'

const generateSectionId = () => `section_${Math.random().toString(36).slice(2, 10)}`

const createSection = (order: number, overrides: Partial<SurveySection> = {}): SurveySection => ({
  ...overrides,
  id: overrides.id ?? generateSectionId(),
  title: overrides.title ?? `Section ${order + 1}`,
  description: overrides.description ?? '',
  order: overrides.order ?? order
})

const normalizeSections = (list: SurveySection[]) =>
  [...list]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((section, index) => ({ ...section, order: index }))

const getSectionLabel = (section: SurveySection, index: number) =>
  section.title?.trim() ? section.title : `Section ${index + 1}`

const resequenceQuestions = (list: SurveyQuestion[]) =>
  list.map((question, index) => ({ ...question, order: index }))

const alignQuestionsToSections = (list: SurveyQuestion[], sections: SurveySection[]) => {
  if (sections.length === 0) {
    return resequenceQuestions(list)
  }

  const orderedBySection = sections.flatMap((section) =>
    list
      .filter((question) => question.sectionId === section.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  )

  const unassigned = list.filter(
    (question) => !question.sectionId || !sections.some((section) => section.id === question.sectionId)
  )

  return resequenceQuestions([...orderedBySection, ...unassigned])
}

const questionTypeOptions: { label: string; type: QuestionType; accent: string }[] = [
  { label: 'Multiple choice', type: 'MULTIPLE_CHOICE', accent: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
  { label: 'Text', type: 'TEXT', accent: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  { label: 'Rating', type: 'RATING', accent: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { label: 'Yes / No', type: 'YES_NO', accent: 'bg-purple-50 text-purple-700 hover:bg-purple-100' }
]

interface SurveyCreatorProps {
  userRole: string
  churchId: string
  onSave?: (surveyData: any) => void
  onPreview?: (surveyData: any) => void
  initialData?: any
}

export default function SurveyCreator({
  userRole,
  churchId,
  onSave,
  onPreview,
  initialData
}: SurveyCreatorProps) {
  const initialSectionsRef = useRef<SurveySection[] | null>(null)

  if (!initialSectionsRef.current) {
    const incomingSections =
      initialData?.sections?.length > 0 ? initialData.sections : [createSection(0)]
    initialSectionsRef.current = normalizeSections(incomingSections)
  }

  const seededSections = initialSectionsRef.current as SurveySection[]

  const [sections, setSections] = useState<SurveySection[]>(seededSections)
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [questions, setQuestions] = useState<SurveyQuestion[]>(() => {
    const fallbackSectionId = seededSections[0]?.id
    const baseQuestions = initialData?.questions || []
    if (!baseQuestions.length) {
      return []
    }

    const hydrated = baseQuestions.map((question) => ({
      ...question,
      sectionId: question.sectionId || fallbackSectionId
    }))

    const ordered = seededSections.flatMap((section) =>
      hydrated
        .filter((question) => question.sectionId === section.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    )

    return ordered.map((question, index) => ({ ...question, order: index }))
  })
  const [settings, setSettings] = useState(
    initialData?.settings || {
      isAnonymous: false,
      allowMultipleResponses: false,
      deadline: null,
      isActive: false
    }
  )
  const [targetAudience, setTargetAudience] = useState<TargetAudience>(
    initialData?.targetAudience || {
      type: 'ALL',
      groupIds: [],
      roleIds: []
    }
  )
  const [activeTab, setActiveTab] = useState<'builder' | 'settings' | 'audience'>('builder')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [inlineAddSectionId, setInlineAddSectionId] = useState<string | null>(null)
  const [showInlineAddMenu, setShowInlineAddMenu] = useState(false)
  const inlineAddMenuRef = useRef<HTMLDivElement | null>(null)

  const questionsWithIndex = useMemo(
    () => questions.map((question, index) => ({ question, index })),
    [questions]
  )

  const sectionsWithQuestions = useMemo(
    () =>
      sections.map((section) => ({
        section,
        questions: questionsWithIndex.filter(({ question }) => question.sectionId === section.id)
      })),
    [sections, questionsWithIndex]
  )

  const updateQuestionsState = (updater: (prev: SurveyQuestion[]) => SurveyQuestion[]) => {
    setQuestions((prev) => alignQuestionsToSections(updater(prev), sections))
  }

  const updateSectionsState = (updater: (prev: SurveySection[]) => SurveySection[]) => {
    setSections((prev) => {
      const next = normalizeSections(updater(prev))
      setQuestions((prevQuestions) => alignQuestionsToSections(prevQuestions, next))
      return next
    })
  }

  const closeInlineAddMenu = () => {
    setShowInlineAddMenu(false)
    setInlineAddSectionId(null)
  }

  const addSection = () => {
    updateSectionsState((prev) => [...prev, createSection(prev.length)])
  }

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    updateSectionsState((prev) => {
      const index = prev.findIndex((section) => section.id === sectionId)
      if (index === -1) {
        return prev
      }
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev
      }
      const next = [...prev]
      const [section] = next.splice(index, 1)
      next.splice(targetIndex, 0, section)
      return next
    })
  }

  const updateSectionDetails = (sectionId: string, updates: Partial<SurveySection>) => {
    setSections((prev) => prev.map((section) => (section.id === sectionId ? { ...section, ...updates } : section)))
  }

  const removeSection = (sectionId: string) => {
    setSections((prev) => {
      if (prev.length === 1) {
        return prev
      }
      const index = prev.findIndex((section) => section.id === sectionId)
      if (index === -1) {
        return prev
      }
      const fallback = prev[index + 1] ?? prev[index - 1]
      setQuestions((prevQuestions) =>
        alignQuestionsToSections(
          prevQuestions.map((question) =>
            question.sectionId === sectionId ? { ...question, sectionId: fallback.id } : question
          ),
          prev.filter((section) => section.id !== sectionId)
        )
      )
      return normalizeSections(prev.filter((section) => section.id !== sectionId))
    })
  }

  const getResolvedSectionId = (preferred?: string | null) => {
    if (preferred && sections.some((section) => section.id === preferred)) {
      return preferred
    }
    return sections[sections.length - 1]?.id || sections[0]?.id
  }

  const addQuestion = (type: QuestionType, targetSectionId?: string | null) => {
    const sectionId = getResolvedSectionId(targetSectionId)
    if (!sectionId) {
      return
    }

    const newQuestion: SurveyQuestion = {
      id: `q_${Date.now()}`,
      sectionId,
      type,
      title: '',
      description: '',
      required: false,
      options: type === 'MULTIPLE_CHOICE' ? [''] : undefined,
      minRating: type === 'RATING' ? 1 : undefined,
      maxRating: type === 'RATING' ? 5 : undefined,
      ratingLabels: type === 'RATING' ? { min: 'Poor', max: 'Excellent' } : undefined
    }
    updateQuestionsState((prev) => [...prev, newQuestion])
  }

  const updateQuestion = (index: number, updatedQuestion: SurveyQuestion) => {
    updateQuestionsState((prev) =>
      prev.map((question, i) =>
        i === index
          ? {
              ...question,
              ...updatedQuestion,
              sectionId: getResolvedSectionId(updatedQuestion.sectionId || question.sectionId)
            }
          : question
      )
    )
  }

  const removeQuestion = (index: number) => {
    updateQuestionsState((prev) => prev.filter((_, i) => i !== index))
  }

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    updateQuestionsState((prev) => {
      const next = [...prev]
      const [movedQuestion] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, movedQuestion)
      return next
    })
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      moveQuestion(draggedIndex, index)
      setDraggedIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const renderQuestion = (question: SurveyQuestion, index: number) => {
    const sharedProps = {
      question,
      onChange: (updated: SurveyQuestion) => updateQuestion(index, updated),
      onRemove: () => removeQuestion(index)
    }

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return <MultipleChoiceQuestion {...sharedProps} />
      case 'TEXT':
        return <TextQuestion {...sharedProps} />
      case 'RATING':
        return <RatingQuestion {...sharedProps} />
      case 'YES_NO':
        return <YesNoQuestion {...sharedProps} />
      default:
        return null
    }
  }

  const handlePreview = () => {
    const surveyData = {
      title,
      description,
      questions,
      sections,
      settings,
      targetAudience
    }
    onPreview?.(surveyData)
  }

  const handleSave = () => {
    const surveyData = {
      title,
      description,
      questions,
      sections,
      settings,
      targetAudience,
      churchId
    }
    onSave?.(surveyData)
  }

  return (
    <div className="flex h-full flex-col space-y-6">
      {activeTab === 'builder' && (
        <div className="bg-white rounded-xl border p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Sections & Questions</h2>
              <p className="text-sm text-gray-500">
                Group related questions together and keep long surveys organized.
              </p>
            </div>
            <button
              type="button"
              onClick={addSection}
              className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100"
            >
              <span className="text-base leading-none">+</span>
              Add section
            </button>
          </div>

          <div className="space-y-6">
            {sectionsWithQuestions.map(({ section, questions: sectionQuestions }) => (
              <div key={section.id} className="rounded-2xl border border-gray-200 bg-white/80 shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSectionDetails(section.id, { title: e.target.value })}
                      className="w-full border-none bg-transparent text-base font-semibold text-gray-900 outline-none placeholder:text-gray-400"
                      placeholder={getSectionLabel(section, section.order ?? 0)}
                    />
                    <textarea
                      value={section.description || ''}
                      onChange={(e) => updateSectionDetails(section.id, { description: e.target.value })}
                      rows={2}
                      className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300"
                      placeholder="Describe this section (optional)"
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={section.order === 0}
                      onClick={() => moveSection(section.id, 'up')}
                      className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-gray-900 disabled:opacity-40"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={section.order === sections.length - 1}
                      onClick={() => moveSection(section.id, 'down')}
                      className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-gray-900 disabled:opacity-40"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSection(section.id)}
                      className="rounded-lg border border-red-100 bg-red-50/60 p-2 text-red-600 hover:bg-red-100 disabled:opacity-40"
                      disabled={sections.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  {sectionQuestions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                      No questions in this section yet.
                    </div>
                  ) : (
                    sectionQuestions.map(({ question, index }) => (
                      <div
                        key={question.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ${
                          draggedIndex === index ? 'opacity-50' : ''
                        } cursor-move`}
                      >
                        <div className="flex items-start gap-3">
                          <GripVertical className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400" />
                          <div className="flex-1">{renderQuestion(question, index)}</div>
                        </div>
                      </div>
                    ))
                  )}

                  <div
                    className="pt-1"
                    ref={inlineAddSectionId === section.id ? inlineAddMenuRef : null}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (inlineAddSectionId === section.id && showInlineAddMenu) {
                          closeInlineAddMenu()
                        } else {
                          setInlineAddSectionId(section.id)
                          setShowInlineAddMenu(true)
                        }
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:border-primary-200 hover:text-primary-700"
                    >
                      <span className="text-xl leading-none text-primary-600">+</span>
                      Add question to {getSectionLabel(section, section.order ?? 0)}
                    </button>

                    {showInlineAddMenu && inlineAddSectionId === section.id && (
                      <div className="mt-3 rounded-2xl border bg-white p-3 shadow-lg ring-1 ring-black/5 sm:w-80">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Question type
                        </p>

                        <div className="grid gap-2">
                          {questionTypeOptions.map((option) => (
                            <button
                              key={option.type}
                              type="button"
                              onClick={() => {
                                addQuestion(option.type, section.id)
                                closeInlineAddMenu()
                              }}
                              className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${option.accent}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <SurveySettings
          settings={settings}
          onChange={setSettings}
        />
      )}

      {activeTab === 'audience' && (
        <TargetAudienceSelector
          targetAudience={targetAudience}
          onChange={setTargetAudience}
          userRole={userRole}
          churchId={churchId}
        />
      )}
    </div>
  )
}