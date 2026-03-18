'use client'

import React, { useState } from 'react'
import { AlertCircle, TrendingUp, TrendingDown, BookOpen, Users } from 'lucide-react'
import { useRecommendations } from '@/hooks/useRecommendations'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'

/**
 * RecommendationDashboard
 * Shows all recommendations for the user
 */
export function RecommendationDashboard() {
  const { recommendations, isLoading, updateStatus } = useRecommendations()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const pendingRecs = recommendations.filter((r) => r.status === 'pending')
  const implementedRecs = recommendations.filter((r) => r.status === 'implemented')

  const getIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return <Users className="w-5 h-5" />
      case 'content':
        return <BookOpen className="w-5 h-5" />
      case 'engagement':
        return <TrendingUp className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const handleAccept = async (id: string) => {
    try {
      await updateStatus(id, 'accepted')
      setToast({ message: 'Recommendation accepted', type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to update recommendation', type: 'error' })
    }
  }

  const handleImplement = async (id: string) => {
    try {
      await updateStatus(id, 'implemented', 'Action completed')
      setToast({ message: 'Recommendation marked as implemented', type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to update recommendation', type: 'error' })
    }
  }

  const handleReject = async (id: string) => {
    try {
      await updateStatus(id, 'rejected')
      setToast({ message: 'Recommendation rejected', type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to update recommendation', type: 'error' })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg bg-gray-200 dark:bg-gray-700 h-32 animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending Recommendations */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recommendations
          </h2>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
            {pendingRecs.length} Pending
          </span>
        </div>

        {pendingRecs.length === 0 ? (
          <div className="p-8 text-center rounded-lg bg-gray-50 dark:bg-gray-900">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              All Caught Up!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No pending recommendations at this time. Great job!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingRecs.map((rec) => (
              <div
                key={rec.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 text-blue-600 dark:text-blue-400 mt-1">
                    {getIcon(rec.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {rec.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {rec.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-2">
                      <span className="inline-block">
                        Confidence:{' '}
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {rec.confidence.charAt(0).toUpperCase() + rec.confidence.slice(1)}
                        </span>
                      </span>
                      <span>•</span>
                      <span>Priority: {rec.priority}/10</span>
                    </p>

                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Suggested Action: </span>
                      {rec.suggestedAction}
                    </div>

                    {rec.expectedImpact && (
                      <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Expected Impact: </span>
                        {rec.expectedImpact}
                      </div>
                    )}

                    <div className="mt-4 flex gap-2 flex-wrap">
                      <Button
                        onClick={() => handleAccept(rec.id)}
                        variant="default"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleImplement(rec.id)}
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Mark Implemented
                      </Button>
                      <Button
                        onClick={() => handleReject(rec.id)}
                        variant="outline"
                        size="sm"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                    {new Date(rec.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Implemented Recommendations */}
      {implementedRecs.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Completed ({implementedRecs.length})
          </h3>
          <div className="grid gap-4">
            {implementedRecs.map((rec) => (
              <div
                key={rec.id}
                className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/10 opacity-75"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 text-green-600 dark:text-green-400 mt-1">
                    {getIcon(rec.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 dark:text-green-200">
                      {rec.title}
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {rec.description}
                    </p>
                    {rec.actionNotes && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        Notes: {rec.actionNotes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

const CheckCircle = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)
