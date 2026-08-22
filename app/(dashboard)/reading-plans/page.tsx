import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import ReadingPlansList from '@/components/ReadingPlansList'

export default async function ReadingPlansPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return <ReadingPlansList />
}

