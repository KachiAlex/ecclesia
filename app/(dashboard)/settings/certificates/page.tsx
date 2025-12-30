import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { CertificateSignatureSettings } from '@/components/CertificateSignatureSettings'

export default async function CertificateSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const user = session.user as any
  if (!user?.churchId) {
    redirect('/dashboard')
  }

  const userRole = user.role
  if (!['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Certificate Settings</h1>
        <p className="text-gray-600">
          Customize how course completion certificates appear for your church
        </p>
      </div>

      <CertificateSignatureSettings churchId={user.churchId} />
    </div>
  )
}