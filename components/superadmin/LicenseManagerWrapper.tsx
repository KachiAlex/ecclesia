'use client'

import { useState, useEffect } from 'react'
import LicenseManager from './LicenseManager'

interface LicenseManagerWrapperProps {
  churchId: string
  initialSubscription: any
  initialPlan: any
  initialPlans: any[]
  initialPlanOverrides?: any[]
}

export default function LicenseManagerWrapper({
  churchId,
  initialSubscription,
  initialPlan,
  initialPlans,
  initialPlanOverrides = [],
}: LicenseManagerWrapperProps) {
  const [subscription, setSubscription] = useState(initialSubscription)
  const [plan, setPlan] = useState(initialPlan)
  const [plans, setPlans] = useState(initialPlans)
  const [planOverrides, setPlanOverrides] = useState(initialPlanOverrides)

  const handleUpdate = async () => {
    const response = await fetch(`/api/superadmin/churches/${churchId}`)
    if (response.ok) {
      const data = await response.json()
      setSubscription(data.subscription)
      setPlan(data.plan)
      setPlans(data.availablePlans || plans)
      setPlanOverrides(data.planOverrides || [])
    }
  }

  return (
    <LicenseManager
      churchId={churchId}
      currentSubscription={subscription}
      currentPlan={plan}
      availablePlans={plans}
      planOverrides={planOverrides}
      onUpdate={handleUpdate}
    />
  )
}

