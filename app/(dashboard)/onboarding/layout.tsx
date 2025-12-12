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
  
  if (!user?.churchId) {
    redirect('/register-church')
  }

  const churchId = await getCurrentChurchId(userId)
  if (!churchId) {
    redirect('/register-church')
  }

  const church = await ChurchService.findById(churchId)
  if (church && (church.address || church.description || church.phone || church.website)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {children}
    </div>
  )
}
