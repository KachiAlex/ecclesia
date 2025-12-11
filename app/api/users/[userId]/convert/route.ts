import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { UserService } from '@/lib/services/user-service'
import { getCurrentChurch } from '@/lib/church-context'
import { requirePermissionMiddleware } from '@/lib/middleware/rbac'
import { scheduleNewConvertFollowUps } from '@/lib/ai/follow-up'

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { error: permError, user } = await requirePermissionMiddleware(
      'manage_roles'
    )

    if (permError) {
      return permError
    }

    const { userId } = params
    const body = await request.json()
    const { newRole, scheduleFollowUps } = body

    if (!newRole) {
      return NextResponse.json(
        { error: 'New role is required' },
        { status: 400 }
      )
    }

    const currentUserId = (user as any).id
    const church = await getCurrentChurch(currentUserId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    // Get target user
    const targetUser = await UserService.findById(userId)

    if (!targetUser || targetUser.churchId !== church.id) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate role transition
    const validTransitions: Record<string, string[]> = {
      VISITOR: ['MEMBER', 'LEADER'],
      MEMBER: ['LEADER', 'VISITOR'],
      LEADER: ['MEMBER', 'PASTOR'],
      PASTOR: ['LEADER', 'ADMIN'],
      ADMIN: ['PASTOR'],
      SUPER_ADMIN: [], // Cannot be changed
    }

    const allowedRoles = validTransitions[targetUser.role] || []
    if (!allowedRoles.includes(newRole)) {
      return NextResponse.json(
        {
          error: `Cannot convert ${targetUser.role} to ${newRole}. Valid transitions: ${allowedRoles.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Update user role
    const updateData: any = {
      role: newRole,
    }

    // If converting to member, set spiritual maturity if not set
    if (newRole === 'MEMBER' && !(targetUser as any).spiritualMaturity) {
      (updateData as any).spiritualMaturity = 'NEW_BELIEVER'
    }

    const updated = await UserService.update(userId, updateData)

    // Schedule follow-ups if converting to member and requested
    let followUpsScheduled = false
    if (newRole === 'MEMBER' && scheduleFollowUps !== false) {
      try {
        await scheduleNewConvertFollowUps(userId)
        followUpsScheduled = true
      } catch (error) {
        console.error('Error scheduling follow-ups:', error)
        // Don't fail the conversion if follow-ups fail
      }
    }

    return NextResponse.json({
      success: true,
      message: `User converted from ${targetUser.role} to ${newRole}`,
      user: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        role: updated.role,
      },
      followUpsScheduled,
    })
  } catch (error: any) {
    console.error('Error converting user:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
