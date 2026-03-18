'use client'

import React from 'react'
import { useMemberEngagementRecommendations } from '@/hooks/useRecommendations'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * MemberEngagementRecommendations
 * Shows personalized suggestions for member engagement
 */
export function MemberEngagementRecommendations() {
  const { recommendations, isGenerating, generate, isLoading } = useMemberEngagementRecommendations()

  const handleGenerate = async () => {
    // Would fetch member data from analytics first
    await generate({
      memberData: [],
    })
  }

  if (isLoading || isGenerating) {
    return (
      <Card className="p-6 space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
      </Card>
    )
  }

  if (recommendations.size === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Member Engagement Insights
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Get personalized recommendations to improve member engagement and identify emerging leaders
        </p>
        <Button
          onClick={handleGenerate}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Generate Insights
        </Button>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">
        Member Engagement Recommendations
      </h3>

      {Array.from(recommendations.entries()).map(([memberId, rec]) => (
        <div
          key={memberId}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Member {memberId.slice(0, 8)}
              </h4>
            </div>
          </div>

          {/* Risk Factors */}
          {rec.riskFactors.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                ⚠️ Risk Factors
              </h5>
              <div className="space-y-2">
                {rec.riskFactors.map((risk, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-red-900 dark:text-red-200">
                        {risk.factor}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${
                        risk.severity === 'high'
                          ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                          : risk.severity === 'medium'
                          ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200'
                          : 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                      }`}>
                        {risk.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {risk.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Actions */}
          {rec.suggestedActions.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                💡 Suggested Actions
              </h5>
              <div className="space-y-2">
                {rec.suggestedActions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-blue-900 dark:text-blue-200">
                        {action.action}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${
                        action.priority === 'high'
                          ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                          : action.priority === 'medium'
                          ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200'
                          : 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                      }`}>
                        {action.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                      {action.description}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Expected: {action.expectedOutcome}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Potential Leaders */}
          {rec.potentialLeaders.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                ⭐ Leadership Potential
              </h5>
              <div className="space-y-2">
                {rec.potentialLeaders.map((leader, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-200">
                          {leader.role}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          {leader.reasoning}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-green-600 dark:text-green-400">
                          {leader.readinessScore.toFixed(0)}%
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-400">Ready</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </Card>
  )
}
