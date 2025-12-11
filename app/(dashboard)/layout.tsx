import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { UserService } from '@/lib/services/user-service'
import { ChurchService } from '@/lib/services/church-service'
import { getCurrentChurchId } from '@/lib/church-context'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import ChurchSwitcher from '@/components/ChurchSwitcher'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  // Check if user has a church
  const userId = (session.user as any).id
  const user = await UserService.findById(userId)
  
  // If user doesn't have a church, redirect to register-church page
  if (!user?.churchId) {
    redirect('/register-church')
  }

  // Verify church exists and check onboarding status
  const churchId = await getCurrentChurchId(userId)
  if (!churchId) {
    redirect('/register-church')
  }

  // Check if onboarding is complete (church has address or description)
  const church = await ChurchService.findById(churchId)
  if (church && !church.address && !church.description) {
    // Onboarding not complete, redirect to onboarding
    redirect('/onboarding')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Sermons', href: '/sermons', icon: '📺' },
    { name: 'Prayer', href: '/prayer', icon: '🙏' },
    { name: 'Giving', href: '/giving', icon: '💰' },
    { name: 'Events', href: '/events', icon: '📅' },
    { name: 'Community', href: '/community', icon: '💬' },
    { name: 'Messages', href: '/messages', icon: '✉️' },
    { name: 'Groups', href: '/groups/nearby', icon: '👥' },
    { name: 'Reading Plans', href: '/reading-plans', icon: '📖' },
    { name: 'Leaderboard', href: '/leaderboard', icon: '🏆' },
    { name: 'Users', href: '/users', icon: '👤' },
    { name: 'Payroll', href: '/payroll', icon: '💼' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="flex items-center space-x-2 px-6 py-5 border-b border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Ecclesia
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all group"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
            </div>
          </div>
          <div className="space-y-1">
            <ChurchSwitcher />
            <Link
              href="/subscription"
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors w-full"
            >
              <span>💳</span>
              <span>Subscription</span>
            </Link>
            <Link
              href="/settings/branding"
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors w-full"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Notifications or other header items can go here */}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
