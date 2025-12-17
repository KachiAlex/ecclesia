import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import LivestreamHub from '@/components/LivestreamHub'

export default async function LivestreamPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userRole = (session.user as any).role
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)

  return <LivestreamHub isAdmin={isAdmin} />
}
