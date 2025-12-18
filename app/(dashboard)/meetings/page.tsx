import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import MeetingsHub from '@/components/MeetingsHub'

export default async function MeetingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userRole = (session.user as any).role
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)

  const canManageMeetings =
    userRole === 'ADMIN' ||
    userRole === 'SUPER_ADMIN' ||
    userRole === 'PASTOR' ||
    userRole === 'BRANCH_ADMIN' ||
    userRole === 'LEADER'

  return <MeetingsHub isAdmin={isAdmin} canManageMeetings={canManageMeetings} />
}
