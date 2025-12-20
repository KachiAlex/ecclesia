'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BIBLE_VERSIONS, DEFAULT_BIBLE_VERSION } from '@/lib/bible/config'

interface ReadingPlan {
  id: string
  title: string
  description?: string
  duration: number
  difficulty?: string
  topics: string[]
  _count: {
    progress: number
  }
  userProgress?: {
    currentDay: number
    completed: boolean
  } | null
}

interface DailyReadingResponse {
  date: string
  entry: {
    reference: string
    passageId: string
    theme: string
  }
  bibleVersion: {
    id: string
    name: string
    abbreviation: string
  }
  passage: {
    reference: string
    content: string
    copyright?: string
  }
}

export default function ReadingPlansList() {
  const router = useRouter()
  const [plans, setPlans] = useState<ReadingPlan[]>([])
  const [recommendations, setRecommendations] = useState<ReadingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [startingPlan, setStartingPlan] = useState<string | null>(null)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [dailyReading, setDailyReading] = useState<DailyReadingResponse | null>(null)
  const [dailyLoading, setDailyLoading] = useState(true)
  const [dailyError, setDailyError] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState(DEFAULT_BIBLE_VERSION.id)

  useEffect(() => {
    loadPlans()
  }, [])

  useEffect(() => {
    loadDailyReading(selectedVersion)
  }, [selectedVersion])

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/reading-plans?userId=current')
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      }
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDailyReading = async (versionId: string) => {
    setDailyLoading(true)
    setDailyError(null)
    try {
      const response = await fetch(`/api/reading-plans/daily?bibleId=${versionId}`)
      if (!response.ok) {
        throw new Error('Failed to load daily reading')
      }
      const data = await response.json()
      setDailyReading(data)
    } catch (error: any) {
      console.error('Error loading daily reading:', error)
      setDailyError(error.message || 'Unable to load daily reading')
    } finally {
      setDailyLoading(false)
    }
  }

  const loadRecommendations = async () => {
    setShowRecommendations(true)
    try {
      const response = await fetch('/api/ai/reading-plans/recommend', {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
      }
    } catch (error) {
      console.error('Error loading recommendations:', error)
    }
  }

  const startPlan = async (planId: string) => {
    setStartingPlan(planId)
    try {
      const response = await fetch(`/api/reading-plans/${planId}/start`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to start plan')
        return
      }

      router.push(`/dashboard/reading-plans/${planId}`)
    } catch (error) {
      console.error('Error starting plan:', error)
      alert('Failed to start plan')
    } finally {
      setStartingPlan(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading reading plans...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">Spiritual Growth</p>
          <h1 className="text-3xl font-bold">Reading Plans</h1>
          <p className="text-gray-600 mt-1">
            Explore guided plans, daily scriptures, and devotionals customized for your church.
          </p>
        </div>
        <button
          onClick={loadRecommendations}
          className="self-start px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Get AI Recommendations
        </button>
      </div>

      {/* Daily Bible reading */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500 rounded-2xl text-white p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-white/70">
              {dailyReading ? new Date(dailyReading.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Daily Scripture'}
            </p>
            <h2 className="text-2xl font-semibold mt-1">Daily Scripture &amp; Devotional</h2>
            {dailyReading && (
              <p className="text-white/80 mt-1">
                {dailyReading.entry.reference} • {dailyReading.entry.theme} ({dailyReading.bibleVersion.abbreviation})
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2 backdrop-blur">
            <label className="text-sm text-white/80">Version</label>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="bg-transparent border border-white/40 rounded-lg px-3 py-1 text-white focus:outline-none"
            >
              {BIBLE_VERSIONS.map((version) => (
                <option key={version.id} value={version.id} className="text-gray-900">
                  {version.abbreviation}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-white/10 rounded-2xl p-4 mt-4 backdrop-blur">
          {dailyLoading ? (
            <p className="text-white/80">Loading today&apos;s passage...</p>
          ) : dailyError ? (
            <p className="text-red-100">{dailyError}</p>
          ) : dailyReading ? (
            <>
              <div
                className="prose prose-invert max-w-none text-white/90 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: dailyReading.passage.content }}
              />
              {dailyReading.passage.copyright && (
                <p className="text-xs text-white/70 mt-3">{dailyReading.passage.copyright}</p>
              )}
            </>
          ) : (
            <p className="text-white/80">No passage available today. Please try again later.</p>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">AI Recommendations for You</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec: any, idx: number) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6"
              >
                <h3 className="text-xl font-semibold mb-2">{rec.title}</h3>
                <p className="text-gray-600 mb-4">{rec.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {rec.topics?.map((topic: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  Duration: {rec.duration} days • Difficulty: {rec.difficulty}
                </div>
                <p className="text-sm text-blue-700 italic mb-4">{rec.reason}</p>
                <button
                  onClick={() => {
                    // Create plan from recommendation
                    alert('Feature: Create plan from recommendation (to be implemented)')
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create This Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Available Reading Plans</h2>
        {plans.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reading Plans Available</h3>
            <p className="text-gray-600">
              Check back later for new reading plans, or ask your church admin to create some.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">{plan.title}</h3>
              {plan.description && (
                <p className="text-gray-600 mb-4">{plan.description}</p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {plan.topics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-600">
                  {plan.duration} days
                  {plan.difficulty && ` • ${plan.difficulty}`}
                </div>
                <div className="text-sm text-gray-500">
                  {plan._count.progress} participants
                </div>
              </div>

              {plan.userProgress ? (
                <div className="space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <div className="text-sm font-medium text-green-800">
                      {plan.userProgress.completed
                        ? 'Completed!'
                        : `Day ${plan.userProgress.currentDay} of ${plan.duration}`}
                    </div>
                    {!plan.userProgress.completed && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${(plan.userProgress.currentDay / plan.duration) * 100}%`,
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/reading-plans/${plan.id}`)}
                    className="w-full px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
                  >
                    Continue Reading
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startPlan(plan.id)}
                  disabled={startingPlan === plan.id}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {startingPlan === plan.id ? 'Starting...' : 'Start Plan'}
                </button>
              )}
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  )
}

