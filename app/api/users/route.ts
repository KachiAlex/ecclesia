import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { UserService } from '@/lib/services/user-service'
import { getCurrentChurch } from '@/lib/church-context'
import { canManageUser } from '@/lib/permissions'
import { checkUsageLimit } from '@/lib/subscription'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get users by church
    let users = await UserService.findByChurch(church.id, limit * page) // Get more to filter

    // Filter by role
    if (role) {
      users = users.filter(user => user.role === role)
    }

    // Filter by search
    if (search) {
      users = await UserService.search(church.id, search)
    }

    // Paginate
    const skip = (page - 1) * limit
    const paginatedUsers = users.slice(skip, skip + limit)

    // Remove password from response
    const usersWithoutPassword = paginatedUsers.map(({ password, ...user }) => user)

    return NextResponse.json({
      users: usersWithoutPassword,
      pagination: {
        page,
        limit,
        total: users.length,
        totalPages: Math.ceil(users.length / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userRole = (session.user as any).role
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    // Check if user has permission to create users (ADMIN, PASTOR, or SUPER_ADMIN)
    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create users' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, password, role: newUserRole } = body

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await UserService.findByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Check usage limits (max users)
    const usageCheck = await checkUsageLimit(church.id, 'maxUsers')
    if (!usageCheck.allowed && usageCheck.limit) {
      return NextResponse.json(
        { 
          error: `User limit reached. Maximum ${usageCheck.limit} users allowed on your plan.`,
          limit: usageCheck.limit,
          current: usageCheck.current
        },
        { status: 403 }
      )
    }

    // Determine role - admins can create any role except SUPER_ADMIN
    let finalRole = newUserRole || 'MEMBER'
    if (finalRole === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot create super admin users' },
        { status: 403 }
      )
    }

    // Check if user has permission to create this role
    if (!canManageUser(userRole as any, finalRole as any)) {
      return NextResponse.json(
        { error: `Insufficient permissions to create ${finalRole} users` },
        { status: 403 }
      )
    }

    // Create user
    const user = await UserService.create({
      firstName,
      lastName,
      email,
      phone: phone || null,
      password,
      role: finalRole,
      churchId: church.id,
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { 
        user: userWithoutPassword, 
        message: 'User created successfully' 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

