import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/login')
  }
  return session
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth()
  const userRole = (session.user as any)?.role
  
  if (!allowedRoles.includes(userRole)) {
    redirect('/dashboard')
  }
  
  return session
}

