'use client'

import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { SurveyQuestion } from '@/types/survey'

interface MultipleChoiceQuestionProps {
  question: SurveyQuestion
  onChange: (question: SurveyQuestion) => void
  onRemove: () => void
}

export default function MultipleChoiceQuestion({
  question,
  onChange,
  onRemove
}: MultipleChoiceQuestionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const updateQuestion = (updates: Partial<SurveyQuestion>) => {
    onChange({ ...question, ...updates })
  }

  const addOption = () => {
    const newOptions = [...(question.options || []), '']
    updateQuestion({ options: newOptions })
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(question.options || [])]
    newOptions[index] = value
    updateQuestion({ options: newOptions })
  }

  const removeOption = (index: number) => {
    const newOptions = (question.options || []).filter((_, i) => i !== index)
    updateQuestion({ options: newOptions })
  }

  return (
    <div className="space-y-4">
      {/* Question Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
              Multiple Choice
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
          <input
            type="text"
            value={question.title}
            onChange={(e) => updateQuestion({ title: e.target.value })}
            placeholder="Enter your question..."
            className="w-full text-lg font-medium border-none outline-none focus:ring-0 p-0 placeholder-gray-400"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 pl-4 border-l-2 border-gray-100">
          {/* Question Description */}
          <div>
            <textarea
              value={question.description || ''}
              onChange={(e) => updateQuestion({ description: e.target.value })}
              placeholder="Add a description (optional)..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Answer Options
            </label>
            {(question.options || []).map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex-shrink-0" />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
                {(question.options?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Option
            </button>
          </div>

          {/* Question Settings */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => updateQuestion({ required: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Required</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={question.allowMultiple || false}
                onChange={(e) => updateQuestion({ allowMultiple: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Allow multiple selections</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}