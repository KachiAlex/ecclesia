import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import SpiritualGrowthPlan from '@/components/SpiritualGrowthPlan'

export default async function GrowthPlanPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return <SpiritualGrowthPlan />
}

