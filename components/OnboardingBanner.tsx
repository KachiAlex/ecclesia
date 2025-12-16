'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OnboardingBanner() {
  const router = useRouter()
  const [church, setChurch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if onboarding is needed
    fetch('/api/churches/me')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setChurch(data)
          // Check if onboarding is incomplete
          const isIncomplete = !data.address && !data.description && !data.phone && !data.website
          if (!isIncomplete) {
            setDismissed(true) // Auto-dismiss if complete
          }
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })

    // Check localStorage for dismissal
    const dismissedState = localStorage.getItem('onboarding-banner-dismissed')
    if (dismissedState === 'true') {
      setDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('onboarding-banner-dismissed', 'true')
  }

  if (loading || dismissed) {
    return null
  }

  const isOnboardingIncomplete = church && !church.address && !church.description && !church.phone && !church.website

  if (!isOnboardingIncomplete) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Complete your church profile</p>
            <p className="text-xs text-gray-600">Add your church details to help members find you</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/onboarding"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Complete Setup
          </Link>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

