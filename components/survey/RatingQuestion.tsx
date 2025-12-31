'use client'

import { useState } from 'react'
import { Trash2, Star } from 'lucide-react'
import { SurveyQuestion } from '@/types/survey'

interface RatingQuestionProps {
  question: SurveyQuestion
  onChange: (question: SurveyQuestion) => void
  onRemove: () => void
}

export default function RatingQuestion({
  question,
  onChange,
  onRemove
}: RatingQuestionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const updateQuestion = (updates: Partial<SurveyQuestion>) => {
    onChange({ ...question, ...updates })
  }

  const renderRatingPreview = () => {
    const min = question.minRating || 1
    const max = question.maxRating || 5
    const items = []
    
    for (let i = min; i <= max; i++) {
      items.push(
        <button
          key={i}
          type="button"
          disabled
          className="flex flex-col items-center gap-1 p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
        >
          {question.ratingStyle === 'stars' ? (
            <Star className="w-5 h-5" />
          ) : (
            <span className="text-lg font-semibold">{i}</span>
          )}
          <span className="text-xs">{i}</span>
        </button>
      )
    }
    
    return (
      <div className="flex gap-2 flex-wrap">
        {items}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Question Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
              Rating Scale
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

          {/* Rating Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating
              </label>
              <select
                value={question.minRating || 1}
                onChange={(e) => updateQuestion({ minRating: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value={0}>0</option>
                <option value={1}>1</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Rating
              </label>
              <select
                value={question.maxRating || 5}
                onChange={(e) => updateQuestion({ maxRating: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={7}>7</option>
                <option value={10}>10</option>
              </select>
            </div>
          </div>

          {/* Rating Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating Style
            </label>
            <select
              value={question.ratingStyle || 'numbers'}
              onChange={(e) => updateQuestion({ ratingStyle: e.target.value as 'numbers' | 'stars' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="numbers">Numbers</option>
              <option value="stars">Stars</option>
            </select>
          </div>

          {/* Rating Labels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Low Rating Label
              </label>
              <input
                type="text"
                value={question.ratingLabels?.min || ''}
                onChange={(e) => updateQuestion({ 
                  ratingLabels: { 
                    ...question.ratingLabels, 
                    min: e.target.value 
                  } 
                })}
                placeholder="e.g., Poor, Disagree"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                High Rating Label
              </label>
              <input
                type="text"
                value={question.ratingLabels?.max || ''}
                onChange={(e) => updateQuestion({ 
                  ratingLabels: { 
                    ...question.ratingLabels, 
                    max: e.target.value 
                  } 
                })}
                placeholder="e.g., Excellent, Agree"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                {question.ratingLabels?.min && (
                  <span className="text-sm text-gray-600">{question.ratingLabels.min}</span>
                )}
                {question.ratingLabels?.max && (
                  <span className="text-sm text-gray-600">{question.ratingLabels.max}</span>
                )}
              </div>
              {renderRatingPreview()}
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