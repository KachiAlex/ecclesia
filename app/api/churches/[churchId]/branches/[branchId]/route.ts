
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { BranchService, BranchAdminService } from '@/lib/services/branch-service'
import { ChurchService } from '@/lib/services/church-service'
import { UserService } from '@/lib/services/user-service'
import {
  resolveBranchScope,
  hasBranchAccess,
  hasGlobalChurchAccess,
} from '@/lib/services/branch-scope'

/**
 * GET /api/churches/[churchId]/branches/[branchId]
 * Get branch details
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ churchId: string; branchId: string }> }
) {
  try {
    const { churchId, branchId } = await params
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

    if (user.churchId !== churchId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const scopeContext = await resolveBranchScope(churchId, user)
    const { branch, allowed } = hasBranchAccess(scopeContext, branchId)

    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    if (!allowed) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get branch admins
    const admins = await BranchAdminService.findByBranch(branchId)
    
    return NextResponse.json({
      ...branch,
      admins,
    })
  } catch (error) {
    console.error('Error fetching branch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/churches/[churchId]/branches/[branchId]
 * Update branch
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ churchId: string; branchId: string }> }
) {
  try {
    const { churchId, branchId } = await params
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

    const scopeContext = await resolveBranchScope(churchId, user)
    const { branch, allowed } = hasBranchAccess(scopeContext, branchId)

    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    const isChurchAdmin = hasGlobalChurchAccess(user, churchId)

    if (!isChurchAdmin && !allowed) {
      return NextResponse.json(
        { error: 'Only admins can update branches' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updatedBranch = await BranchService.update(branchId, body)
    
    return NextResponse.json(updatedBranch)
  } catch (error) {
    console.error('Error updating branch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/churches/[churchId]/branches/[branchId]
 * Delete branch (soft delete)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ churchId: string; branchId: string }> }
) {
  try {
    const { churchId, branchId } = await params
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

    // Only church admins can delete branches
    if (!hasGlobalChurchAccess(user, churchId)) {
      return NextResponse.json(
        { error: 'Only church admins can delete branches' },
        { status: 403 }
      )
    }

    const scopeContext = await resolveBranchScope(churchId, user)
    const { branch } = hasBranchAccess(scopeContext, branchId)

    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    await BranchService.delete(branchId)
    
    return NextResponse.json({ message: 'Branch deleted successfully' })
  } catch (error) {
    console.error('Error deleting branch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
