import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import HierarchySettings from '@/components/HierarchySettings'

export default function HierarchySettingsPage() {
  return <HierarchySettingsPageInner />
}

async function HierarchySettingsPageInner() {
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
          <p className="text-yellow-800">
            No church selected. Please select or create a church first.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/settings" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2">
            <span aria-hidden="true" className="mr-2">
              ←
            </span>
            Back to settings
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Hierarchy levels</h1>
          <p className="text-gray-600 mt-1">
            Define the labels and order for headquarters, regions, zones, and other tiers in your
            branch structure.
          </p>
        </div>
      </div>

      <HierarchySettings church={church as any} />
    </div>
  )
}
