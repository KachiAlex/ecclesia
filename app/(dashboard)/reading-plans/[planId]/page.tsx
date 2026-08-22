import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import ReadingPlanDetail from '@/components/ReadingPlanDetail'

export default async function ReadingPlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>
}) {
  const { planId } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return <ReadingPlanDetail planId={planId} />
}

