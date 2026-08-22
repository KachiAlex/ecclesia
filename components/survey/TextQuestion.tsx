'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { SurveyQuestion } from '@/types/survey'

interface TextQuestionProps {
  question: SurveyQuestion
  onChange: (question: SurveyQuestion) => void
  onRemove: () => void
}

export default function TextQuestion({
  question,
  onChange,
  onRemove
}: TextQuestionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const updateQuestion = (updates: Partial<SurveyQuestion>) => {
    onChange({ ...question, ...updates })
  }

  return (
    <div className="space-y-4">
      {/* Question Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
              Text Response
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

          {/* Text Input Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Response Type
            </label>
            <select
              value={question.textType || 'short'}
              onChange={(e) => updateQuestion({ textType: e.target.value as 'short' | 'long' | 'email' | 'number' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="short">Short Text (Single Line)</option>
              <option value="long">Long Text (Multiple Lines)</option>
              <option value="email">Email Address</option>
              <option value="number">Number</option>
            </select>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            {question.textType === 'long' ? (
              <textarea
                placeholder="Respondent will type their answer here..."
                rows={3}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm"
              />
            ) : (
              <input
                type={question.textType === 'email' ? 'email' : question.textType === 'number' ? 'number' : 'text'}
                placeholder={
                  question.textType === 'email' 
                    ? 'respondent@example.com'
                    : question.textType === 'number'
                    ? '123'
                    : 'Respondent will type their answer here...'
                }
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm"
              />
            )}
          </div>

          {/* Character Limit (for text types) */}
          {(question.textType === 'short' || question.textType === 'long') && (
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={question.hasCharacterLimit || false}
                  onChange={(e) => updateQuestion({ hasCharacterLimit: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Set character limit</span>
              </label>
              {question.hasCharacterLimit && (
                <input
                  type="number"
                  value={question.characterLimit || ''}
                  onChange={(e) => updateQuestion({ characterLimit: parseInt(e.target.value) || undefined })}
                  placeholder="Maximum characters"
                  min="1"
                  max="10000"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              )}
            </div>
          )}

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