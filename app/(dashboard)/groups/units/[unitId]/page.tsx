import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import UnitDetails from '@/components/UnitDetails'

export default async function UnitPage({ params }: { params: { unitId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return <UnitDetails unitId={params.unitId} />
}
