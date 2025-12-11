'use client'

import { useState, useEffect } from 'react'
import LicenseManager from './LicenseManager'
import { SubscriptionPlan } from '@/lib/services/subscription-service'

interface LicenseManagerWrapperProps {
  churchId: string
  initialSubscription: any
  initialPlan: any
  initialPlans: SubscriptionPlan[]
}

export default function LicenseManagerWrapper({
  churchId,
  initialSubscription,
  initialPlan,
  initialPlans,
}: LicenseManagerWrapperProps) {
  const [subscription, setSubscription] = useState(initialSubscription)
  const [plan, setPlan] = useState(initialPlan)
  const [plans, setPlans] = useState(initialPlans)

  const handleUpdate = async () => {
    // Fetch updated data
    const response = await fetch(`/api/superadmin/churches/${churchId}`)
    if (response.ok) {
      const data = await response.json()
      setSubscription(data.subscription)
      setPlan(data.plan)
    }
  }

  return (
    <LicenseManager
      churchId={churchId}
      currentSubscription={subscription}
      currentPlan={plan}
      availablePlans={plans}
      onUpdate={handleUpdate}
    />
  )
}

