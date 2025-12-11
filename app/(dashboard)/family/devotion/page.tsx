import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import FamilyDevotion from '@/components/FamilyDevotion'

export default async function FamilyDevotionPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return <FamilyDevotion />
}

