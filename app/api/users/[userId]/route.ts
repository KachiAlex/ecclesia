
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { UserService } from '@/lib/services/user-service'
import { getCurrentChurch } from '@/lib/church-context'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import bcrypt from 'bcryptjs'
import { DesignationService } from '@/lib/services/designation-service'
import { canManageUser } from '@/lib/permissions'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
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
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
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
      isStaff,
      staffLevelId,
      customWage,
      customWageAmount,
      customWageCurrency,
      customWagePayFrequency,
      designationId,
      isSuspended,
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

    // Only privileged users can change roles, and must respect hierarchy
    const privilegedRoles = ['ADMIN', 'SUPER_ADMIN', 'PASTOR', 'BRANCH_ADMIN']

    if (role !== undefined && privilegedRoles.includes(userRole)) {
      // Validate that the current user can assign this role
      if (!canManageUser(userRole as any, role as any)) {
        return NextResponse.json(
          { error: `You don't have permission to assign the ${role} role` },
          { status: 403 }
        )
      }
      updateData.role = role
    }

    let cachedChurch: Awaited<ReturnType<typeof getCurrentChurch>> | null = null
    let cachedTargetUser: Awaited<ReturnType<typeof UserService.findById>> | null = null

    const resolveChurchContext = async () => {
      if (!cachedChurch) {
        cachedChurch = await getCurrentChurch(currentUserId)
      }
      if (!cachedChurch) {
        return { error: NextResponse.json({ error: 'No church selected' }, { status: 400 }) }
      }
      if (!cachedTargetUser) {
        cachedTargetUser = await UserService.findById(userId)
      }
      if (!cachedTargetUser || cachedTargetUser.churchId !== cachedChurch.id) {
        return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) }
      }
      return { church: cachedChurch, targetUser: cachedTargetUser }
    }

    const normalizeCustomWage = () => {
      const payload = customWage || {
        amount: customWageAmount,
        currency: customWageCurrency,
        payFrequency: customWagePayFrequency,
      }
      if (!payload || typeof payload !== 'object') {
        throw new Error('Custom wage must include amount, currency, and pay frequency')
      }
      const amount = typeof payload.amount === 'number' ? payload.amount : Number(payload.amount)
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Custom wage amount must be greater than 0')
      }
      const currency = String(payload.currency ?? '').trim().toUpperCase()
      if (!/^[A-Z]{3}$/.test(currency)) {
        throw new Error('Custom wage currency must be a 3-letter ISO code')
      }
      const payFrequency = String(payload.payFrequency ?? '').toLowerCase()
      const validFrequencies = ['weekly', 'biweekly', 'monthly', 'annual']
      if (!validFrequencies.includes(payFrequency)) {
        throw new Error('Custom wage pay frequency is invalid')
      }
      return { amount, currency, payFrequency }
    }

    if (isStaff !== undefined || staffLevelId !== undefined || customWage !== undefined || customWageAmount !== undefined) {
      const context = await resolveChurchContext()
      if ('error' in context) {
        return context.error
      }
      const { church, targetUser } = context

      const staffFlag = isStaff !== undefined ? Boolean(isStaff) : Boolean(targetUser.isStaff)
      updateData.isStaff = staffFlag

      if (staffFlag) {
        const levelId = staffLevelId ?? targetUser.staffLevelId
        if (!levelId) {
          return NextResponse.json({ error: 'Staff level is required for staff members' }, { status: 400 })
        }
        const staffLevel = await db.collection(COLLECTIONS.staffLevels).doc(levelId).get()
        if (!staffLevel.exists || staffLevel.data()?.churchId !== church.id) {
          return NextResponse.json({ error: 'Invalid staff level' }, { status: 400 })
        }
        updateData.staffLevelId = levelId
        updateData.staffLevelName = staffLevel.data()?.name

        if (customWage !== undefined || customWageAmount !== undefined) {
          try {
            updateData.customWage = normalizeCustomWage()
          } catch (err: any) {
            return NextResponse.json({ error: err.message }, { status: 400 })
          }
        }
      } else {
        updateData.staffLevelId = null
        updateData.staffLevelName = null
        updateData.customWage = null
      }
    }

    if (designationId !== undefined) {
      if (!privilegedRoles.includes(userRole)) {
        return NextResponse.json({ error: 'Insufficient permissions to assign designations' }, { status: 403 })
      }
      const context = await resolveChurchContext()
      if ('error' in context) {
        return context.error
      }
      if (designationId === null || designationId === '') {
        updateData.designationId = null
        updateData.designationName = null
      } else {
        const designation = await DesignationService.get(designationId)
        if (!designation || designation.churchId !== context.church.id) {
          return NextResponse.json({ error: 'Invalid designation' }, { status: 400 })
        }
        updateData.designationId = designation.id
        updateData.designationName = designation.name
      }
    }

    if (typeof isSuspended === 'boolean') {
      if (!privilegedRoles.includes(userRole)) {
        return NextResponse.json({ error: 'Insufficient permissions to update suspension status' }, { status: 403 })
      }
      const context = await resolveChurchContext()
      if ('error' in context) {
        return context.error
      }
      updateData.isSuspended = isSuspended
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUserId = (session.user as any).id
    const userRole = (session.user as any).role

    if (!['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    if (userId === currentUserId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
    }

    const church = await getCurrentChurch(currentUserId)
    if (!church) {
      return NextResponse.json({ error: 'No church selected' }, { status: 400 })
    }

    const targetUser = await UserService.findById(userId)
    if (!targetUser || targetUser.churchId !== church.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cannot delete super admin accounts' }, { status: 403 })
    }

    await UserService.delete(userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
