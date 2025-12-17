import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userRole = (session.user as any).role
  if (!['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/settings/general"
          className="bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow"
        >
          <div className="text-lg font-semibold">General</div>
          <div className="text-sm text-gray-600 mt-1">Timezone and church defaults.</div>
        </Link>

        <Link
          href="/settings/branding"
          className="bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow"
        >
          <div className="text-lg font-semibold">Branding</div>
          <div className="text-sm text-gray-600 mt-1">Logo, colors, and custom domain.</div>
        </Link>
      </div>
    </div>
  )
}
