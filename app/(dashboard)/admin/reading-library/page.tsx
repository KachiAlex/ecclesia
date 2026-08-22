import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import ReadingLibraryAdmin from '@/components/ReadingLibraryAdmin'

export default async function ReadingLibraryAdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userRole = (session.user as any).role
  if (!['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)) {
    redirect('/dashboard')
  }

  return <ReadingLibraryAdmin />
}
