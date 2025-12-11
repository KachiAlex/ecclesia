import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  // Check if user is super admin
  const userRole = (session.user as any)?.role
  if (userRole !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Super Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/superadmin" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">SA</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Super Admin</span>
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                <Link
                  href="/superadmin"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/superadmin/churches"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Churches
                </Link>
                <Link
                  href="/superadmin/subscriptions"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Subscriptions
                </Link>
                <Link
                  href="/superadmin/analytics"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Analytics
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Go to Dashboard →
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

