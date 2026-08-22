import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import GivingProjectsAdmin from '@/components/GivingProjectsAdmin'

export default async function GivingProjectsAdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userRole = (session.user as any).role
  if (!['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)) {
    redirect('/dashboard')
  }

  return <GivingProjectsAdmin />
}

