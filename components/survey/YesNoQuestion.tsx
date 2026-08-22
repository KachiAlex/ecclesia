'use client'

import { useState } from 'react'
import { Trash2, Check, X } from 'lucide-react'
import { SurveyQuestion } from '@/types/survey'

interface YesNoQuestionProps {
  question: SurveyQuestion
  onChange: (question: SurveyQuestion) => void
  onRemove: () => void
}

export default function YesNoQuestion({
  question,
  onChange,
  onRemove
}: YesNoQuestionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const updateQuestion = (updates: Partial<SurveyQuestion>) => {
    onChange({ ...question, ...updates })
  }

  const renderPreview = () => {
    const yesLabel = question.yesNoLabels?.yes || 'Yes'
    const noLabel = question.yesNoLabels?.no || 'No'
    
    return (
      <div className="flex gap-4">
        <button
          type="button"
          disabled
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
        >
          <Check className="w-4 h-4" />
          {yesLabel}
        </button>
        <button
          type="button"
          disabled
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
        >
          <X className="w-4 h-4" />
          {noLabel}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Question Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
              Yes/No
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

          {/* Custom Labels */}
          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={question.hasCustomLabels || false}
                onChange={(e) => updateQuestion({ hasCustomLabels: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Use custom labels</span>
            </label>
            
            {question.hasCustomLabels && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Positive Response Label
                  </label>
                  <input
                    type="text"
                    value={question.yesNoLabels?.yes || ''}
                    onChange={(e) => updateQuestion({ 
                      yesNoLabels: { 
                        ...question.yesNoLabels, 
                        yes: e.target.value 
                      } 
                    })}
                    placeholder="Yes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Negative Response Label
                  </label>
                  <input
                    type="text"
                    value={question.yesNoLabels?.no || ''}
                    onChange={(e) => updateQuestion({ 
                      yesNoLabels: { 
                        ...question.yesNoLabels, 
                        no: e.target.value 
                      } 
                    })}
                    placeholder="No"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="p-4 bg-gray-50 rounded-lg">
              {renderPreview()}
            </div>
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
          </div>
        </div>
      )}
    </div>
  )
}