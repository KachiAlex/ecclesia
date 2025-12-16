import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import GivingProjects from '@/components/GivingProjects'

export default async function GivingPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userRole = (session.user as any).role
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)

  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <GivingProjects isAdmin={isAdmin} />
    </Suspense>
  )
}

