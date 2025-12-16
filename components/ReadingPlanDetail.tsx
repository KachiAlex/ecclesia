'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ReadingPlan {
  id: string
  title: string
  description?: string
  duration: number
  userProgress: {
    id: string
    currentDay: number
    completed: boolean
    startedAt: string
    completedAt?: string
  } | null
}

export default function ReadingPlanDetail({ planId }: { planId: string }) {
  const router = useRouter()
  const [plan, setPlan] = useState<ReadingPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadPlan()
  }, [planId])

  const loadPlan = async () => {
    try {
      const response = await fetch(`/api/reading-plans/${planId}`)
      if (response.ok) {
        const data = await response.json()
        setPlan(data)
      } else {
        console.error('Failed to load reading plan')
      }
    } catch (error) {
      console.error('Error loading reading plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProgress = async (day: number, completed?: boolean) => {
    if (!plan?.userProgress) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/reading-plans/progress/${plan.userProgress.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentDay: day,
          completed: completed !== undefined ? completed : day >= plan.duration,
        }),
      })

      if (response.ok) {
        await loadPlan() // Reload to get updated progress
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update progress')
      }
    } catch (error) {
      console.error('Error updating progress:', error)
      alert('Failed to update progress')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading reading plan...</div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Reading plan not found</div>
        <Link href="/dashboard/reading-plans" className="mt-4 inline-block text-primary-600 hover:underline">
          ← Back to Reading Plans
        </Link>
      </div>
    )
  }

  const progress = plan.userProgress
  const progressPercent = progress ? (progress.currentDay / plan.duration) * 100 : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/reading-plans"
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Reading Plans
        </Link>
        <h1 className="text-3xl font-bold mb-2">{plan.title}</h1>
        {plan.description && (
          <p className="text-gray-600 mb-4">{plan.description}</p>
        )}
      </div>

      {/* Progress Section */}
      {progress ? (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Progress</h2>
            {progress.completed && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ✓ Completed
              </span>
            )}
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Day {progress.currentDay} of {plan.duration}</span>
              <span>{Math.round(progressPercent)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary-600 h-3 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {progress.completed && progress.completedAt && (
            <p className="text-sm text-gray-600">
              Completed on {new Date(progress.completedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-center">
          <p className="text-gray-600 mb-4">You haven&apos;t started this reading plan yet.</p>
          <button
            onClick={async () => {
              try {
                const response = await fetch(`/api/reading-plans/${planId}/start`, {
                  method: 'POST',
                })
                if (response.ok) {
                  await loadPlan()
                } else {
                  const errorData = await response.json()
                  alert(errorData.error || 'Failed to start plan')
                }
              } catch (error) {
                console.error('Error starting plan:', error)
                alert('Failed to start plan')
              }
            }}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Start Reading Plan
          </button>
        </div>
      )}

      {/* Daily Reading Section */}
      {progress && !progress.completed && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Today&apos;s Reading</h2>
          <div className="mb-4">
            <p className="text-gray-600 mb-4">
              Day {progress.currentDay} of {plan.duration}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Mark today&apos;s reading as complete to advance to the next day.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => updateProgress(progress.currentDay + 1)}
              disabled={updating || progress.currentDay >= plan.duration}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Updating...' : 'Mark Day Complete'}
            </button>
            {progress.currentDay > 1 && (
              <button
                onClick={() => updateProgress(progress.currentDay - 1)}
                disabled={updating}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Go Back One Day
              </button>
            )}
          </div>
        </div>
      )}

      {/* Plan Info */}
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Plan Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Duration:</span>
            <span className="ml-2 font-medium">{plan.duration} days</span>
          </div>
          {progress && (
            <div>
              <span className="text-gray-600">Started:</span>
              <span className="ml-2 font-medium">
                {new Date(progress.startedAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

