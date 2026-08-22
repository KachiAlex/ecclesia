'use client'

import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface SubscriptionStatusProps {
  churchId: string
  subscription: {
    id: string
    status: string
    currentPeriodStart: Date
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
  }
  plan: {
    name: string
    price: number
    currency: string
  }
  usage: {
    userCount: number
    storageUsedGB: number
    sermonsCount: number
    eventsCount: number
    apiCalls: number
  }
  limits: {
    maxUsers?: number
    maxStorageGB?: number
    maxSermons?: number
    maxEvents?: number
  }
}

export default function SubscriptionStatus({
  churchId,
  subscription,
  plan,
  usage,
  limits,
}: SubscriptionStatusProps) {
  const [cancelling, setCancelling] = useState(false)

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return
    }

    setCancelling(true)
    try {
      const response = await fetch(`/api/subscriptions/church/${churchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelAtPeriodEnd: true }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  const getUsagePercentage = (current: number, limit?: number) => {
    if (!limit) return 0
    return Math.min((current / limit) * 100, 100)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
            <p className="text-gray-600">
              {formatCurrency(plan.price)}/{subscription.status === 'TRIAL' ? 'trial' : 'month'}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                subscription.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : subscription.status === 'TRIAL'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {subscription.status}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Current Period</p>
            <p className="font-medium">
              {formatDate(subscription.currentPeriodStart)} -{' '}
              {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
          {subscription.cancelAtPeriodEnd && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">
                Subscription will cancel at period end
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Usage</h3>
        <div className="space-y-4">
          {limits.maxUsers && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Users</span>
                <span>
                  {usage.userCount} / {limits.maxUsers}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${getUsagePercentage(usage.userCount, limits.maxUsers)}%` }}
                ></div>
              </div>
            </div>
          )}

          {limits.maxSermons && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Sermons</span>
                <span>
                  {usage.sermonsCount} / {limits.maxSermons}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${getUsagePercentage(usage.sermonsCount, limits.maxSermons)}%` }}
                ></div>
              </div>
            </div>
          )}

          {limits.maxEvents && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Events (this month)</span>
                <span>
                  {usage.eventsCount} / {limits.maxEvents}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${getUsagePercentage(usage.eventsCount, limits.maxEvents)}%` }}
                ></div>
              </div>
            </div>
          )}

          {limits.maxStorageGB && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Storage</span>
                <span>
                  {usage.storageUsedGB.toFixed(2)} GB / {limits.maxStorageGB} GB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{
                    width: `${getUsagePercentage(usage.storageUsedGB, limits.maxStorageGB)}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <p className="text-sm text-gray-600">
              API Calls: <span className="font-medium">{usage.apiCalls}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleCancel}
          disabled={cancelling || subscription.cancelAtPeriodEnd}
          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
        </button>
      </div>
    </div>
  )
}

