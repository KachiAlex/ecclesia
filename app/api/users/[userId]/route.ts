import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { UserService } from '@/lib/services/user-service'
import { getCurrentChurch } from '@/lib/church-context'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import bcrypt from 'bcryptjs'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params
    const currentUserId = (session.user as any).id
    const userRole = (session.user as any).role

    // Users can view their own profile, admins can view anyone
    if (userId !== currentUserId && !['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const user = await UserService.findById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get counts
    const [departmentsCount, groupsCount, badgesCount, prayerRequestsCount, sermonsWatchedCount, givingCount, eventsAttendedCount] = await Promise.all([
      db.collection(COLLECTIONS.departments).where('members', 'array-contains', userId).count().get(),
      db.collection(COLLECTIONS.groups).where('members', 'array-contains', userId).count().get(),
      db.collection(COLLECTIONS.userBadges).where('userId', '==', userId).count().get(),
      db.collection(COLLECTIONS.prayerRequests).where('userId', '==', userId).count().get(),
      db.collection(COLLECTIONS.sermonViews).where('userId', '==', userId).count().get(),
      db.collection(COLLECTIONS.giving).where('userId', '==', userId).count().get(),
      db.collection(COLLECTIONS.eventAttendances).where('userId', '==', userId).count().get(),
    ])

    // Remove password
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({
      ...userWithoutPassword,
      _count: {
        departments: departmentsCount.data().count || 0,
        groups: groupsCount.data().count || 0,
        badges: badgesCount.data().count || 0,
        prayerRequests: prayerRequestsCount.data().count || 0,
        sermonsWatched: sermonsWatchedCount.data().count || 0,
        giving: givingCount.data().count || 0,
        eventsAttended: eventsAttendedCount.data().count || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params
    const currentUserId = (session.user as any).id
    const userRole = (session.user as any).role

    // Users can edit their own profile (except role), admins can edit anyone
    if (userId !== currentUserId && !['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      phone,
      bio,
      dateOfBirth,
      address,
      city,
      state,
      zipCode,
      country,
      spiritualMaturity,
      role,
      profileImage,
      password,
    } = body

    const updateData: any = {}
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (phone !== undefined) updateData.phone = phone
    if (bio !== undefined) updateData.bio = bio
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (zipCode !== undefined) updateData.zipCode = zipCode
    if (country !== undefined) updateData.country = country
    if (spiritualMaturity !== undefined) updateData.spiritualMaturity = spiritualMaturity
    if (profileImage !== undefined) updateData.profileImage = profileImage

    // Only admins can change roles
    if (role !== undefined && ['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)) {
      updateData.role = role
    }

    // Handle password change
    if (password) {
      if (userId !== currentUserId) {
        return NextResponse.json(
          { error: 'Cannot change another user\'s password' },
          { status: 403 }
        )
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await UserService.update(userId, updateData)

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      firstName: userWithoutPassword.firstName,
      lastName: userWithoutPassword.lastName,
      role: userWithoutPassword.role,
      profileImage: userWithoutPassword.profileImage,
    })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

