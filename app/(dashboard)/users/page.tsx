import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import MemberDirectory from '@/components/MemberDirectory'

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const role = (session.user as any)?.role as string | undefined
  const userId = (session.user as any)?.id

  // Members can only see their own profile
  if (role === 'MEMBER') {
    redirect(`/users/${userId}`)
  }

  return <MemberDirectory />
}

