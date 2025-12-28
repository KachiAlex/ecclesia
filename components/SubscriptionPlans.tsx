'use client'

import { useMemo, useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Plan {
  id: string
  name: string
  type: string
  description?: string
  price: number
  currency: string
  billingCycle?: string
  maxUsers?: number
  maxStorageGB?: number
  maxSermons?: number
  maxEvents?: number
  maxDepartments?: number
  maxGroups?: number
  features: string[]
  trialDays: number
}

interface SubscriptionPlansProps {
  churchId: string
  currentPlanId?: string
}

export default function SubscriptionPlans({ churchId, currentPlanId }: SubscriptionPlansProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const monthlyPriceLabel = (plan: Plan) => {
    if (plan.price === 0) return 'Free forever'
    const cadence = plan.billingCycle === 'annual' ? 'year' : 'month'
    return `${formatCurrency(plan.price)}/${cadence}`
  }

  const tierRank = (plan?: Plan) => {
    if (!plan) return Number.MAX_SAFE_INTEGER
    const order = ['FREE', 'STARTER', 'GROWTH', 'PRO', 'BUSINESS', 'ENTERPRISE']
    const type = (plan.type || '').toUpperCase()
    const index = order.indexOf(type)
    return index === -1 ? order.length : index
  }

  const recommendedUpgradeId = useMemo(() => {
    if (!plans.length || !currentPlanId) return null
    const currentPlan = plans.find((plan) => plan.id === currentPlanId)
    const currentRank = tierRank(currentPlan)
    return (
      plans
        .filter((plan) => plan.id !== currentPlanId)
        .filter((plan) => tierRank(plan) > currentRank)
        .sort((a, b) => tierRank(a) - tierRank(b))[0]?.id ?? null
    )
  }, [currentPlanId, plans])

  const handlePlanAction = async (planId: string) => {
    if (planId === currentPlanId) return

    setSubscribing(planId)
    setError(null)

    try {
      const response = await fetch(`/api/subscriptions/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      if (response.ok) {
        const data = await response.json()

        if (data.authorizationUrl) {
          window.open(data.authorizationUrl, '_blank', 'noopener,noreferrer')
        } else if (data.subscription) {
          window.location.reload()
        } else if (data.message) {
          alert(data.message)
        }
      } else {
        const error = await response.json().catch(() => ({}))
        setError(error.error || 'Failed to start upgrade')
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setSubscribing(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading plans...</div>
  }

  const limitsList = (plan: Plan) => {
    const entries: { label: string; value?: number }[] = [
      { label: 'Users', value: plan.maxUsers },
      { label: 'Storage (GB)', value: plan.maxStorageGB },
      { label: 'Sermons', value: plan.maxSermons },
      { label: 'Events/mo', value: plan.maxEvents },
      { label: 'Departments', value: plan.maxDepartments },
      { label: 'Groups', value: plan.maxGroups },
    ]

    return entries.filter(item => item.value).slice(0, 4)
  }

  return (
    <div id="plan-comparison" className="grid md:grid-cols-3 gap-6 scroll-mt-24">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`border rounded-2xl p-6 hover:shadow-lg transition-shadow ${
            plan.id === currentPlanId ? 'border-primary-200 shadow-primary-100/40 bg-white' : 'border-gray-200 bg-white/80'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{plan.type}</div>
            {plan.id === currentPlanId ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                Current plan
              </span>
            ) : plan.id === recommendedUpgradeId ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-100">
                Recommended upgrade
              </span>
            ) : (
              <span className="text-xs text-gray-400">{plan.trialDays > 0 ? `${plan.trialDays}-day trial` : 'Upgrade available'}</span>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
            <p className="text-3xl font-bold text-primary-600 mt-1">
              {monthlyPriceLabel(plan)}
              {plan.price > 0 && plan.billingCycle === 'annual' && (
                <span className="block text-sm font-normal text-gray-500">Billed annually</span>
              )}
            </p>
            {plan.description && <p className="text-gray-600 text-sm mt-2">{plan.description}</p>}
            <p className="text-xs text-gray-500 mt-2">
              {plan.trialDays > 0 ? `Includes ${plan.trialDays}-day guided onboarding` : 'Activation in under 2 minutes'}
            </p>
          </div>

          <div className="mb-6 space-y-3">
            {limitsList(plan).length > 0 && (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide mb-2">Included capacity</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  {limitsList(plan).map((item) => (
                    <li key={item.label} className="flex items-center gap-2">
                      <span className="text-gray-400">•</span>
                      <span>
                        {item.label}: <span className="font-semibold">{item.value}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {plan.features.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide mb-1">Highlights</p>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  {plan.features.slice(0, 5).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-xs text-gray-500">
                      +{plan.features.length - 5} more features
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {error && subscribing === plan.id && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            onClick={() => handlePlanAction(plan.id)}
            disabled={subscribing === plan.id || plan.id === currentPlanId}
            className={`w-full py-2 rounded-lg transition-colors text-sm font-semibold ${
              plan.id === currentPlanId
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                : 'bg-primary-600 text-white hover:bg-primary-700 border border-primary-600 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {plan.id === currentPlanId
              ? 'Your current plan'
              : subscribing === plan.id
              ? 'Applying...'
              : currentPlanId
              ? 'Switch to this plan'
              : 'Start trial'}
          </button>
        </div>
      ))}
    </div>
  )
}

