import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import SermonPlayer from '@/components/SermonPlayer'

export default async function SermonPage({
  params,
}: {
  params: Promise<{ sermonId: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const { sermonId } = await params
  return <SermonPlayer sermonId={sermonId} />
}

