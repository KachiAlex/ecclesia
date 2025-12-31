'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Settings, Users, Save, Eye } from 'lucide-react'
import { SurveyQuestion, QuestionType, TargetAudience } from '@/types/survey'
import MultipleChoiceQuestion from './survey/MultipleChoiceQuestion'
import TextQuestion from './survey/TextQuestion'
import RatingQuestion from './survey/RatingQuestion'
import YesNoQuestion from './survey/YesNoQuestion'
import SurveySettings from './SurveySettings'
import TargetAudienceSelector from './survey/TargetAudienceSelector'

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
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [questions, setQuestions] = useState<SurveyQuestion[]>(initialData?.questions || [])
  const [settings, setSettings] = useState(initialData?.settings || {
    isAnonymous: false,
    allowMultipleResponses: false,
    deadline: null,
    isActive: false
  })
  const [targetAudience, setTargetAudience] = useState<TargetAudience>(
    initialData?.targetAudience || {
      type: 'all',
      groupIds: [],
      roleIds: []
    }
  )
  const [activeTab, setActiveTab] = useState<'builder' | 'settings' | 'audience'>('builder')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const addQuestion = (type: QuestionType) => {
    const newQuestion: SurveyQuestion = {
      id: `q_${Date.now()}`,
      type,
      title: '',
      description: '',
      required: false,
      order: questions.length,
      options: type === 'multiple_choice' ? [''] : undefined,
      minRating: type === 'rating' ? 1 : undefined,
      maxRating: type === 'rating' ? 5 : undefined,
      ratingLabels: type === 'rating' ? { min: 'Poor', max: 'Excellent' } : undefined
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (index: number, updatedQuestion: SurveyQuestion) => {
    const newQuestions = [...questions]
    newQuestions[index] = updatedQuestion
    setQuestions(newQuestions)
  }

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index)
    // Update order for remaining questions
    const reorderedQuestions = newQuestions.map((q, i) => ({ ...q, order: i }))
    setQuestions(reorderedQuestions)
  }

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    const newQuestions = [...questions]
    const [movedQuestion] = newQuestions.splice(fromIndex, 1)
    newQuestions.splice(toIndex, 0, movedQuestion)
    // Update order for all questions
    const reorderedQuestions = newQuestions.map((q, i) => ({ ...q, order: i }))
    setQuestions(reorderedQuestions)
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

  const handleSave = () => {
    const surveyData = {
      title,
      description,
      questions,
      settings,
      targetAudience,
      churchId
    }
    onSave?.(surveyData)
  }

  const handlePreview = () => {
    const surveyData = {
      title,
      description,
      questions,
      settings,
      targetAudience
    }
    onPreview?.(surveyData)
  }

  const renderQuestion = (question: SurveyQuestion, index: number) => {
    const commonProps = {
      question,
      onChange: (updatedQuestion: SurveyQuestion) => updateQuestion(index, updatedQuestion),
      onRemove: () => removeQuestion(index)
    }

    switch (question.type) {
      case 'multiple_choice':
        return <MultipleChoiceQuestion key={question.id} {...commonProps} />
      case 'text':
        return <TextQuestion key={question.id} {...commonProps} />
      case 'rating':
        return <RatingQuestion key={question.id} {...commonProps} />
      case 'yes_no':
        return <YesNoQuestion key={question.id} {...commonProps} />
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create Survey</h1>
          <p className="text-gray-600">Build your survey and gather feedback</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Survey
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border p-2 flex gap-2 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('builder')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'builder'
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          }`}
        >
          Builder
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audience')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'audience'
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Audience
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          {/* Survey Basic Info */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Survey Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter survey title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this survey..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Question Builder */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Questions</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addQuestion('multiple_choice')}
                  className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                >
                  + Multiple Choice
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('text')}
                  className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                >
                  + Text
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('rating')}
                  className="px-3 py-2 text-sm bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100"
                >
                  + Rating
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('yes_no')}
                  className="px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
                >
                  + Yes/No
                </button>
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No questions added yet.</p>
                <p className="text-sm mt-1">Click one of the buttons above to add your first question.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`border rounded-lg p-4 ${
                      draggedIndex === index ? 'opacity-50' : ''
                    } cursor-move`}
                  >
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        {renderQuestion(question, index)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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