import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import SermonPlayer from '@/components/SermonPlayer'

export default async function SermonPage({
  params,
}: {
  params: { sermonId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return <SermonPlayer sermonId={params.sermonId} />
}

