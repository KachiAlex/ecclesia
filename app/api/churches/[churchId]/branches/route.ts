import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { BranchService, BranchAdminService, generateBranchSlug } from '@/lib/services/branch-service'
import { ChurchService } from '@/lib/services/church-service'
import { UserService } from '@/lib/services/user-service'

/**
 * GET /api/churches/[churchId]/branches
 * Get all branches for a church
 */
export async function GET(
  request: Request,
  { params }: { params: { churchId: string } }
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

    // Verify user belongs to this church
    if (user.churchId !== params.churchId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const branches = await BranchService.findByChurch(params.churchId)
    
    return NextResponse.json(branches)
  } catch (error) {
    console.error('Error fetching branches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/churches/[churchId]/branches
 * Create a new branch
 */
export async function POST(
  request: Request,
  { params }: { params: { churchId: string } }
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

    // Verify user is admin of this church
    const church = await ChurchService.findById(params.churchId)
    if (!church) {
      return NextResponse.json(
        { error: 'Church not found' },
        { status: 404 }
      )
    }

    if (user.churchId !== params.churchId || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Only church admins can create branches' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, address, city, state, zipCode, country, phone, email, description, adminId } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Branch name is required' },
        { status: 400 }
      )
    }

    // Generate unique slug within church
    let baseSlug = generateBranchSlug(name)
    let slug = baseSlug
    let counter = 1
    
    while (true) {
      const existingBranch = await BranchService.findBySlug(params.churchId, slug)
      if (!existingBranch) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create branch
    const branch = await BranchService.create({
      name,
      slug,
      churchId: params.churchId,
      address: address || null,
      city: city || null,
      state: state || null,
      zipCode: zipCode || null,
      country: country || null,
      phone: phone || null,
      email: email || null,
      description: description || null,
      adminId: adminId || null,
      isActive: true,
    })

    // If adminId provided, assign as branch admin
    if (adminId) {
      const adminUser = await UserService.findById(adminId)
      if (adminUser && adminUser.churchId === params.churchId) {
        // Assign as branch admin
        await BranchAdminService.assignAdmin({
          branchId: branch.id,
          userId: adminId,
          canManageMembers: true,
          canManageEvents: true,
          canManageGroups: true,
          canManageGiving: false,
          canManageSermons: false,
          assignedBy: userId,
        })

        // Update branch with admin ID
        await BranchService.update(branch.id, { adminId })

        // Update user role to BRANCH_ADMIN if not already ADMIN
        if (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
          await UserService.update(adminId, {
            role: 'BRANCH_ADMIN',
            branchId: branch.id,
          })
        }
      }
    }

    return NextResponse.json(branch, { status: 201 })
  } catch (error) {
    console.error('Error creating branch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

