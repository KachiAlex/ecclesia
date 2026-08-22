
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { VolunteerShiftService } from '@/lib/services/volunteer-service'
import { UserService } from '@/lib/services/user-service'
import { guardApi } from '@/lib/api-guard'
import { hasPermission } from '@/lib/permissions'

export async function GET(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { role, church } = guarded.ctx

    if (!role || !hasPermission(role, 'manage_volunteers')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

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
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { role, church } = guarded.ctx

    if (!role || !hasPermission(role, 'manage_volunteers')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

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
      role: shiftRole,
      startTime,
      endTime,
    } = body

    if (!assignUserId || !shiftRole || !startTime) {
      return NextResponse.json(
        { error: 'User ID, role, and start time are required' },
        { status: 400 }
      )
    }

    const shift = await VolunteerShiftService.create({
      userId: assignUserId,
      departmentId: departmentId || undefined,
      role: shiftRole,
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
