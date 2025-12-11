import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { UserService } from '@/lib/services/user-service'
import { ChurchService } from '@/lib/services/church-service'
import { getCurrentChurchId } from '@/lib/church-context'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userId = (session.user as any).id
  const user = await UserService.findById(userId)
  
  // If user doesn't have a church, redirect to register-church
  if (!user?.churchId) {
    redirect('/register-church')
  }

  // Check if onboarding is already complete
  const churchId = await getCurrentChurchId(userId)
  if (churchId) {
    const church = await ChurchService.findById(churchId)
    // Onboarding is complete if church has address OR description OR phone OR website
    // This ensures churches have at least some basic information
    if (church && (church.address || church.description || church.phone || church.website)) {
      redirect('/dashboard')
    }
  }

  // Simple layout without sidebar for onboarding
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}

