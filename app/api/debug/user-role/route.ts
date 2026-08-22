import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { UserService } from '@/lib/services/user-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = (session.user as any)?.id
    const sessionRole = (session.user as any)?.role
    
    const user = await UserService.findById(userId)
    
    return NextResponse.json({
      sessionUserId: userId,
      sessionRole: sessionRole,
      dbUser: user ? {
        id: user.id,
        role: user.role,
        isStaff: user.isStaff,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      } : null,
      sessionUser: session.user
    })
  } catch (error) {
    console.error('Debug user role error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}