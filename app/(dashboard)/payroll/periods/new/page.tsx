import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import NewPayPeriod from '@/components/NewPayPeriod'

export default async function NewPayPeriodPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return <NewPayPeriod />
}

