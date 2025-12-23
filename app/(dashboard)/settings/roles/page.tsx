import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import RoleDesignationSettings from '@/components/RoleDesignationSettings'

export default async function RoleSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userId = (session.user as any).id
  const userRole = (session.user as any).role

  if (!['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)) {
    redirect('/dashboard')
  }

  const church = await getCurrentChurch(userId)

  if (!church) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No church selected. Please select or create a church first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Settings</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Roles &amp; Designations</h1>
        <p className="text-gray-600 mt-2">
          Configure the roles and ministry designations that admins can assign to users in your church.
        </p>
      </div>

      <RoleDesignationSettings />
    </div>
  )
}
