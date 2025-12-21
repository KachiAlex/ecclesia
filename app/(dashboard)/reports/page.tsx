import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth-options'
import ReportsHub from '@/components/ReportsHub'

const MANAGER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'BRANCH_ADMIN', 'PASTOR', 'LEADER']

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/login')
  }

  const role = (session.user as any)?.role as string | undefined
  if (!role || !MANAGER_ROLES.includes(role)) {
    redirect('/dashboard')
  }

  return <ReportsHub />
}
