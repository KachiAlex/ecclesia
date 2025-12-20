'use client'

import { useState } from 'react'
import { SubscriptionPlan } from '@/lib/services/subscription-service'

interface LicenseManagerProps {
  churchId: string
  currentSubscription: any
  currentPlan: any
  availablePlans: SubscriptionPlan[]
  onUpdate: () => void
}

export default function LicenseManager({
  churchId,
  currentSubscription,
  currentPlan,
  availablePlans,
  onUpdate,
}: LicenseManagerProps) {
  const [loading, setLoading] = useState(false)
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [daysToExtend, setDaysToExtend] = useState(30)

  const handleExtendTrial = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/superadmin/churches/${churchId}/extend-trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: daysToExtend }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extend trial')
      }

      setMessage({ type: 'success', text: data.message })
      setShowExtendModal(false)
      onUpdate()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePlan = async (planId: string) => {
    setCheckoutPlanId(planId)
    setMessage(null)

    try {
      const response = await fetch(`/api/superadmin/churches/${churchId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start checkout')
      }

      if (data.authorizationUrl) {
        if (typeof window !== 'undefined') {
          window.open(data.authorizationUrl, '_blank', 'noopener,noreferrer')
        }
        setMessage({
          type: 'success',
          text: 'Checkout launched in a new tab. Complete payment to apply the upgrade automatically.',
        })
      } else if (data.subscription) {
        setMessage({
          type: 'success',
          text: data.message || 'Plan updated successfully.',
        })
        onUpdate()
      } else if (data.message) {
        setMessage({ type: 'success', text: data.message })
      }

      setShowPlanModal(false)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setCheckoutPlanId(null)
    }
  }

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this church? They will lose access to the platform.')) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/superadmin/churches/${churchId}/suspend`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to suspend church')
      }

      setMessage({ type: 'success', text: data.message })
      onUpdate()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/superadmin/churches/${churchId}/activate`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to activate church')
      }

      setMessage({ type: 'success', text: data.message })
      onUpdate()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'TRIAL':
        return 'bg-blue-100 text-blue-800'
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      case 'SUSPENDED':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const trialEndDate = currentSubscription?.trialEndsAt
    ? new Date(currentSubscription.trialEndsAt.toDate ? currentSubscription.trialEndsAt.toDate() : currentSubscription.trialEndsAt)
    : null

  const isTrial = currentSubscription?.status === 'TRIAL'
  const isSuspended = currentSubscription?.status === 'SUSPENDED'

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Current License Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">License Management</h2>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
              currentSubscription?.status || 'TRIAL'
            )}`}
          >
            {currentSubscription?.status || 'TRIAL'}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Plan</label>
            <p className="text-lg font-semibold text-gray-900">
              {currentPlan?.name || 'Free Trial'}
            </p>
            {currentPlan && (
              <p className="text-sm text-gray-600 mt-1">
                ${currentPlan.price}/{currentPlan.billingCycle === 'monthly' ? 'mo' : 'yr'}
              </p>
            )}
          </div>

          {trialEndDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isTrial ? 'Trial Ends' : 'Subscription Ends'}
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {trialEndDate.toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {Math.ceil((trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isTrial && (
            <button
              onClick={() => setShowExtendModal(true)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Extend Trial
            </button>
          )}

          <button
            onClick={() => setShowPlanModal(true)}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            Change / Upgrade Plan
          </button>

          {isSuspended ? (
            <button
              onClick={handleActivate}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Activate
            </button>
          ) : (
            <button
              onClick={handleSuspend}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Suspend
            </button>
          )}

          <button
            onClick={() => {
              if (confirm('Activate subscription immediately?')) {
                fetch(`/api/superadmin/churches/${churchId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'update_status', status: 'ACTIVE' }),
                }).then(() => onUpdate())
              }
            }}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            Set Active
          </button>
        </div>
      </div>

      {/* Extend Trial Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Extend Trial Period</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days to Extend
                </label>
                <input
                  type="number"
                  value={daysToExtend}
                  onChange={(e) => setDaysToExtend(parseInt(e.target.value) || 30)}
                  min="1"
                  max="365"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleExtendTrial}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Extending...' : 'Extend Trial'}
                </button>
                <button
                  onClick={() => setShowExtendModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Change Subscription Plan</h3>
            <div className="space-y-3">
              {availablePlans.map((plan) => {
                const isCurrent = plan.id === currentPlan?.id
                const isProcessing = checkoutPlanId === plan.id
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => handleChangePlan(plan.id)}
                    disabled={isProcessing}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${isProcessing ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                        <p className="text-sm text-gray-600">{plan.description}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                          {plan.maxUsers && <span>Max {plan.maxUsers} users</span>}
                          {plan.maxSermons && <span>{plan.maxSermons} sermons</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ${plan.price}/{plan.billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </p>
                        {isCurrent && (
                          <span className="text-xs text-blue-600 font-medium">Current</span>
                        )}
                        {isProcessing && (
                          <span className="block text-xs text-purple-600 font-medium">
                            Launching checkout…
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setShowPlanModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

