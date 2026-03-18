'use client'

import React, { useState } from 'react'
import { useContentRecommendations } from '@/hooks/useRecommendations'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * ContentRecommendations
 * Suggests sermon topics and content based on church engagement and seasonality
 */
export function ContentRecommendations() {
  const { contentRecommendations, isLoading, isGenerating, generateRecommendations } = useContentRecommendations()
  const [showAll, setShowAll] = useState(false)

  const handleGenerate = async () => {
    await generateRecommendations({
      topTopics: [],
      missedTopics: [],
      memberInterests: [],
      upcomingEvents: [],
      seasonalContext: new Date().toLocaleDateString('en-US', { month: 'long' }),
    })
  }

  if (isLoading || isGenerating) {
    return (
      <Card className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
      </Card>
    )
  }

  if (contentRecommendations.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Content Recommendations
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Get AI-powered suggestions for sermon topics based on engagement trends and seasonal context
        </p>
        <Button
          onClick={handleGenerate}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Get Topic Suggestions
        </Button>
      </Card>
    )
  }

  const displayedRecs = showAll
    ? contentRecommendations
    : contentRecommendations.slice(0, 5)

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
          Content Recommendations
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
        >
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {displayedRecs.map((rec, idx) => (
          <div
            key={idx}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 hover:shadow-md transition"
          >
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {rec.topic}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {rec.reason}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {rec.priority}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    priority
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {contentRecommendations.length > 5 && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show less' : `Show ${contentRecommendations.length - 5} more`}
          </Button>
        </div>
      )}
    </Card>
  )
}
