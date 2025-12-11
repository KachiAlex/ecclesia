import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { BranchService, BranchAdminService } from '@/lib/services/branch-service'
import { UserService } from '@/lib/services/user-service'

/**
 * GET /api/churches/[churchId]/branches/[branchId]/admins
 * Get all admins for a branch
 */
export async function GET(
  request: Request,
  { params }: { params: { churchId: string; branchId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const user = await UserService.findById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const branch = await BranchService.findById(params.branchId)
    
    if (!branch || branch.churchId !== params.churchId) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    // Verify user has access
    if (user.churchId !== params.churchId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const admins = await BranchAdminService.findByBranch(params.branchId)
    
    // Get user details for each admin
    const adminsWithUsers = await Promise.all(
      admins.map(async (admin) => {
        const adminUser = await UserService.findById(admin.userId)
        return {
          ...admin,
          user: adminUser ? {
            id: adminUser.id,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
            email: adminUser.email,
            role: adminUser.role,
          } : null,
        }
      })
    )
    
    return NextResponse.json(adminsWithUsers)
  } catch (error) {
    console.error('Error fetching branch admins:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/churches/[churchId]/branches/[branchId]/admins
 * Assign admin to branch
 */
export async function POST(
  request: Request,
  { params }: { params: { churchId: string; branchId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const user = await UserService.findById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const branch = await BranchService.findById(params.branchId)
    
    if (!branch || branch.churchId !== params.churchId) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    // Only church admins can assign branch admins
    if (user.churchId !== params.churchId || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Only church admins can assign branch admins' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId: targetUserId, canManageMembers, canManageEvents, canManageGroups, canManageGiving, canManageSermons } = body

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const targetUser = await UserService.findById(targetUserId)
    
    if (!targetUser || targetUser.churchId !== params.churchId) {
      return NextResponse.json(
        { error: 'User not found or does not belong to this church' },
        { status: 400 }
      )
    }

    // Assign as branch admin
    const branchAdmin = await BranchAdminService.assignAdmin({
      branchId: params.branchId,
      userId: targetUserId,
      canManageMembers: canManageMembers ?? true,
      canManageEvents: canManageEvents ?? true,
      canManageGroups: canManageGroups ?? true,
      canManageGiving: canManageGiving ?? false,
      canManageSermons: canManageSermons ?? false,
      assignedBy: userId,
    })

    // Update user role to BRANCH_ADMIN if not already ADMIN
    if (targetUser.role !== 'ADMIN' && targetUser.role !== 'SUPER_ADMIN') {
      await UserService.update(targetUserId, {
        role: 'BRANCH_ADMIN',
        branchId: params.branchId,
      })
    }

    return NextResponse.json(branchAdmin, { status: 201 })
  } catch (error) {
    console.error('Error assigning branch admin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/churches/[churchId]/branches/[branchId]/admins
 * Remove admin from branch
 */
export async function DELETE(
  request: Request,
  { params }: { params: { churchId: string; branchId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const user = await UserService.findById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const branch = await BranchService.findById(params.branchId)
    
    if (!branch || branch.churchId !== params.churchId) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    // Only church admins can remove branch admins
    if (user.churchId !== params.churchId || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Only church admins can remove branch admins' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId: targetUserId } = body

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    await BranchAdminService.removeAdmin(params.branchId, targetUserId)

      // Update user role if they're no longer a branch admin
      const targetUser = await UserService.findById(targetUserId)
      if (targetUser && targetUser.role === 'BRANCH_ADMIN' && targetUser.branchId === params.branchId) {
        // Check if user is admin of any other branch
        const otherBranchAdmins = await BranchAdminService.findByUser(targetUserId)
        if (otherBranchAdmins.length === 0) {
          // Remove BRANCH_ADMIN role, set to MEMBER
          await UserService.update(targetUserId, {
            role: 'MEMBER',
            branchId: undefined,
          })
        }
      }

    return NextResponse.json({ message: 'Admin removed successfully' })
  } catch (error) {
    console.error('Error removing branch admin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

