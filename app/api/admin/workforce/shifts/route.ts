import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import { requirePermissionMiddleware } from '@/lib/middleware/rbac'
import { VolunteerShiftService } from '@/lib/services/volunteer-service'
import { UserService } from '@/lib/services/user-service'

export async function GET(request: Request) {
  try {
    const { error: permError } = await requirePermissionMiddleware('manage_volunteers')
    if (permError) {
      return permError
    }

    const session = await getServerSession(authOptions)
    const userId = (session?.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const shifts = await VolunteerShiftService.findByChurch(
      church.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )

    // Add user info to shifts
    const shiftsWithUsers = await Promise.all(
      shifts.map(async (shift) => {
        const user = await UserService.findById(shift.userId)
        return {
          ...shift,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profileImage: user.profileImage,
          } : null,
        }
      })
    )

    return NextResponse.json(shiftsWithUsers)
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { error: permError } = await requirePermissionMiddleware('manage_volunteers')
    if (permError) {
      return permError
    }

    const session = await getServerSession(authOptions)
    const userId = (session?.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      userId: assignUserId,
      departmentId,
      role,
      startTime,
      endTime,
    } = body

    if (!assignUserId || !role || !startTime) {
      return NextResponse.json(
        { error: 'User ID, role, and start time are required' },
        { status: 400 }
      )
    }

    const shift = await VolunteerShiftService.create({
      userId: assignUserId,
      departmentId: departmentId || undefined,
      role,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      status: 'Scheduled',
    })

    // Add user info
    const user = await UserService.findById(assignUserId)
    const shiftWithUser = {
      ...shift,
      user: user ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      } : null,
    }

    return NextResponse.json(shiftWithUser, { status: 201 })
  } catch (error: any) {
    console.error('Error creating shift:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

