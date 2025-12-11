import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import BrandingSettings from '@/components/BrandingSettings'

export default async function BrandingPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userId = (session.user as any).id
  const userRole = (session.user as any).role

  // Only admins, pastors, and super admins can access branding settings
  if (!['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)) {
    redirect('/dashboard')
  }

  const church = await getCurrentChurch(userId)

  if (!church) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            No church selected. Please select or create a church first.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Branding Settings</h1>
      <BrandingSettings church={church} />
    </div>
  )
}

