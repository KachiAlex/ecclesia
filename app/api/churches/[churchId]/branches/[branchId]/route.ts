import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { BranchService, BranchAdminService } from '@/lib/services/branch-service'
import { ChurchService } from '@/lib/services/church-service'
import { UserService } from '@/lib/services/user-service'

/**
 * GET /api/churches/[churchId]/branches/[branchId]
 * Get branch details
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
    
    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    // Verify branch belongs to church
    if (branch.churchId !== params.churchId) {
      return NextResponse.json(
        { error: 'Branch does not belong to this church' },
        { status: 400 }
      )
    }

    // Verify user has access
    if (user.churchId !== params.churchId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get branch admins
    const admins = await BranchAdminService.findByBranch(params.branchId)
    
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
    
    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }

    // Verify user is church admin or branch admin
    const isChurchAdmin = user.churchId === params.churchId && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')
    const isBranchAdmin = await BranchAdminService.findByBranchAndUser(params.branchId, userId)
    
    if (!isChurchAdmin && !isBranchAdmin) {
      return NextResponse.json(
        { error: 'Only admins can update branches' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updatedBranch = await BranchService.update(params.branchId, body)
    
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

    // Only church admins can delete branches
    if (user.churchId !== params.churchId || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Only church admins can delete branches' },
        { status: 403 }
      )
    }

    await BranchService.delete(params.branchId)
    
    return NextResponse.json({ message: 'Branch deleted successfully' })
  } catch (error) {
    console.error('Error deleting branch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

