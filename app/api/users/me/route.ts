import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { UserService } from '@/lib/services/user-service'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const user = await UserService.findById(userId)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      firstName: userWithoutPassword.firstName,
      lastName: userWithoutPassword.lastName,
      phone: userWithoutPassword.phone,
      role: userWithoutPassword.role,
      spiritualMaturity: (userWithoutPassword as any).spiritualMaturity,
      profileImage: userWithoutPassword.profileImage,
      bio: (userWithoutPassword as any).bio,
      xp: userWithoutPassword.xp || 0,
      level: userWithoutPassword.level || 1,
      createdAt: userWithoutPassword.createdAt,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

