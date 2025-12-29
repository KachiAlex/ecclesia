import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { UserService } from '@/lib/services/user-service'
import { getCurrentChurch, getCurrentChurchId } from '@/lib/church-context'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import ChurchSwitcher from '@/components/ChurchSwitcher'
import BranchSwitcher from '@/components/BranchSwitcher'
import OnboardingBanner from '@/components/OnboardingBanner'
import DashboardNav from '@/components/DashboardNav'

export const dynamic = 'force-dynamic'

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

  // If SUPER_ADMIN, always redirect to superadmin portal
  if (user?.role === 'SUPER_ADMIN') {
    redirect('/superadmin')
  }

  // If user doesn't have a church and is not a superadmin, redirect to register
  if (!user?.churchId && user?.role !== 'SUPER_ADMIN') {
    console.log('Dashboard layout: No churchId and not superadmin, redirecting to register', { userId: user?.id, role: user?.role, churchId: user?.churchId })
    redirect('/auth/register')
  }

  // For SUPER_ADMIN, skip church verification
  let activeChurch: Awaited<ReturnType<typeof getCurrentChurch>> | null = null
  if (user?.role !== 'SUPER_ADMIN') {
    // Verify church exists
    const churchId = await getCurrentChurchId(userId)
    if (!churchId) {
      console.log('Dashboard layout: No church found, redirecting to register', { userId, role: user?.role })
      redirect('/auth/register')
    }
    activeChurch = await getCurrentChurch(userId)
  }

  console.log('Dashboard layout: Rendering dashboard', { userId, role: user?.role, churchId: user?.churchId })

  const brandName = activeChurch?.name ?? 'Ecclesia'
  const brandTagline = activeChurch?.tagline ?? 'Church Management'
  const brandLogo = activeChurch?.logo ?? '/ecclesia%20logo.svg'
  const brandInitial = brandName?.[0]?.toUpperCase() ?? 'E'
  const profileName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || session.user?.name || 'Admin user'
  const profileEmail = session.user?.email || user?.email || ''
  const profileImage = (user as any)?.profileImage || (session.user as any)?.image || ''
  const profileInitials =
    profileName
      .split(' ')
      .map((part) => part.trim().charAt(0).toUpperCase())
      .join('')
      .slice(0, 2) || profileEmail.charAt(0).toUpperCase() || 'A'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col shadow-xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-6 py-6 border-b border-gray-200/50">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl blur opacity-50"></div>
            <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              {activeChurch?.logo ? (
                <img src={brandLogo} alt={`${brandName} logo`} className="w-10 h-10 object-contain" />
              ) : (
                <span className="text-white text-xl font-semibold">{brandInitial}</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {brandName}
            </span>
            <p className="text-xs text-gray-500 font-medium truncate">{brandTagline}</p>
          </div>
        </Link>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <DashboardNav userRole={(session.user as any).role} />
        </div>

        {/* User Section */}
        <div className="border-t border-gray-200/50 p-4 bg-gradient-to-br from-gray-50/50 to-blue-50/30">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full blur opacity-40"></div>
              <div className="relative w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold text-sm">
                  {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{session.user?.name || 'User'}</p>
              <p className="text-xs text-gray-600 truncate">{session.user?.email}</p>
            </div>
          </div>

          <div className="space-y-3 w-full">
            <div className="grid grid-cols-2 gap-2 pt-2 px-2">
              <Link
                href="/subscription"
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-gray-700 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-gray-200/50"
              >
                <span>💳</span>
                <span>Plan</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-gray-700 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-gray-200/50"
              >
                <span>⚙️</span>
                <span>Settings</span>
              </Link>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-72">
        {/* Onboarding Banner */}
        <OnboardingBanner />

        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Welcome back!
                </h1>
                <p className="text-sm text-gray-600 mt-1 font-medium">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
                <div className="flex w-full flex-col gap-3 lg:max-w-sm">
                <div className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={profileName}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-primary-100"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 ring-2 ring-primary-50">
                        {profileInitials}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{profileName}</p>
                          <p className="text-xs text-gray-500">{profileEmail}</p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/users/${userId}`}
                            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            View
                          </Link>
                          <Link
                            href={`/users/${userId}/edit`}
                            className="rounded-full border border-primary-200 px-3 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-50"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Update your profile details and avatar.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm">
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Church</div>
                    <ChurchSwitcher />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Branch</div>
                    <BranchSwitcher />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}
