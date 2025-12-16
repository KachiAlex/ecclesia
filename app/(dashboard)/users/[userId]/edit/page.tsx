import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import UserProfileEdit from '@/components/UserProfileEdit'

export default async function UserProfileEditPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const { userId } = await params
  return <UserProfileEdit userId={userId} />
}

