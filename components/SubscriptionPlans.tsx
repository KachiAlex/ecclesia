'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Plan {
  id: string
  name: string
  type: string
  description?: string
  price: number
  currency: string
  maxUsers?: number
  maxStorageGB?: number
  maxSermons?: number
  maxEvents?: number
  features: string[]
  trialDays: number
}

interface SubscriptionPlansProps {
  churchId: string
}

export default function SubscriptionPlans({ churchId }: SubscriptionPlansProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans')
      const data = await response.json()
      setPlans(data)
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId)
    try {
      const response = await fetch(`/api/subscriptions/church/${churchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, startTrial: true }),
      })

      if (response.ok) {
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to subscribe')
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setSubscribing(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading plans...</div>
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <div className="mb-4">
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {formatCurrency(plan.price)}
              <span className="text-sm font-normal text-gray-600">/month</span>
            </div>
            {plan.description && (
              <p className="text-gray-600 text-sm mt-2">{plan.description}</p>
            )}
          </div>

          <div className="mb-6">
            <ul className="space-y-2">
              {plan.maxUsers && (
                <li className="text-sm">
                  <span className="font-medium">Users:</span> Up to {plan.maxUsers}
                </li>
              )}
              {plan.maxSermons && (
                <li className="text-sm">
                  <span className="font-medium">Sermons:</span> Up to {plan.maxSermons}
                </li>
              )}
              {plan.maxEvents && (
                <li className="text-sm">
                  <span className="font-medium">Events:</span> Up to {plan.maxEvents}/month
                </li>
              )}
              {plan.maxStorageGB && (
                <li className="text-sm">
                  <span className="font-medium">Storage:</span> {plan.maxStorageGB} GB
                </li>
              )}
              {plan.features.map((feature, idx) => (
                <li key={idx} className="text-sm flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {plan.trialDays > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              {plan.trialDays}-day free trial
            </div>
          )}

          <button
            onClick={() => handleSubscribe(plan.id)}
            disabled={subscribing === plan.id}
            className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {subscribing === plan.id ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>
      ))}
    </div>
  )
}

