import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { UserService } from '@/lib/services/user-service'

export default async function RegisterChurchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  // Check if user already has a church
  const userId = (session.user as any).id
  const user = await UserService.findById(userId)
  
  // If user already has a church, redirect to dashboard
  if (user?.churchId) {
    redirect('/dashboard')
  }

  // Simple layout without sidebar for register-church page
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}

