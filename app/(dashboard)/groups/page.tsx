import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import GroupsHub from '@/components/GroupsHub'
import LeaderGroupsHub from '@/components/LeaderGroupsHub'

export default async function GroupsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userRole = (session.user as any)?.role

  // Leaders see a restricted view of only their groups
  if (userRole === 'LEADER') {
    return <LeaderGroupsHub />
  }

  return <GroupsHub />
}
