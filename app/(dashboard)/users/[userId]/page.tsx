import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import UserProfile from '@/components/UserProfile'

export default async function UserProfilePage({
  params,
}: {
  params: { userId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return <UserProfile userId={params.userId} />
}

