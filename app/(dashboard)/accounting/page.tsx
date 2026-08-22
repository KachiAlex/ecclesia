import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import AccountingHub from '@/components/AccountingHub'

export default async function AccountingPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const role = (session.user as any)?.role as string | undefined
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'BRANCH_ADMIN' || role === 'PASTOR'

  return <AccountingHub isAdmin={isAdmin} />
}
