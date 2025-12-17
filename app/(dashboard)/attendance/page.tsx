import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import AttendanceHub from '@/components/AttendanceHub'

export default async function AttendancePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const role = (session.user as any)?.role as string | undefined
  const isManager =
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    role === 'BRANCH_ADMIN' ||
    role === 'PASTOR' ||
    role === 'LEADER'

  return <AttendanceHub isManager={isManager} />
}
