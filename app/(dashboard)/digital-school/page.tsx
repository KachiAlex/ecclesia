import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import DigitalSchool from '@/components/DigitalSchool'

export default async function DigitalSchoolPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return <DigitalSchool />
}
