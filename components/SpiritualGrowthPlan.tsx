'use client'

import { useState } from 'react'

interface GrowthPlan {
  dailyPractices: string[]
  weeklyPractices: string[]
  monthlyGoals: string[]
  recommendedResources: string[]
  milestones: string[]
}

export default function SpiritualGrowthPlan() {
  const [plan, setPlan] = useState<GrowthPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [goals, setGoals] = useState('')
  const [challenges, setChallenges] = useState('')
  const [error, setError] = useState('')

  const generatePlan = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ai/growth-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: goals.split(',').map((g) => g.trim()).filter(Boolean),
          challenges: challenges.split(',').map((c) => c.trim()).filter(Boolean),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate plan')
      }

      const data = await response.json()
      setPlan(data.plan)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Personalized Spiritual Growth Plan</h1>
        <p className="text-gray-600">
          Get a customized plan to help you grow in your faith journey.
        </p>
      </div>

      {!plan ? (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="goals" className="block text-sm font-medium text-gray-700 mb-2">
                Your Spiritual Goals (comma-separated)
              </label>
              <textarea
                id="goals"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="e.g., Deeper prayer life, Better understanding of the Bible, Serve in ministry"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="challenges" className="block text-sm font-medium text-gray-700 mb-2">
                Challenges You&apos;re Facing (comma-separated)
              </label>
              <textarea
                id="challenges"
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder="e.g., Finding time for devotions, Dealing with doubt, Staying consistent"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              onClick={generatePlan}
              disabled={loading}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating Your Plan...' : 'Generate Growth Plan'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Your Growth Plan</h2>
            <button
              onClick={() => setPlan(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Generate New Plan
            </button>
          </div>

          {/* Daily Practices */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">📅</span> Daily Practices
            </h3>
            <ul className="space-y-2">
              {plan.dailyPractices.map((practice, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">✓</span>
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weekly Practices */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">📆</span> Weekly Practices
            </h3>
            <ul className="space-y-2">
              {plan.weeklyPractices.map((practice, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">✓</span>
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Monthly Goals */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🎯</span> Monthly Goals
            </h3>
            <ul className="space-y-2">
              {plan.monthlyGoals.map((goal, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">✓</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Resources */}
          {plan.recommendedResources.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">📚</span> Recommended Resources
              </h3>
              <ul className="space-y-2">
                {plan.recommendedResources.map((resource, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>{resource}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Milestones */}
          {plan.milestones.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">🏆</span> Milestones to Track
              </h3>
              <ul className="space-y-2">
                {plan.milestones.map((milestone, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">🎯</span>
                    <span>{milestone}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

