
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import {
  BranchService,
  BranchAdminService,
  generateBranchSlug,
  BranchLevel,
  Branch,
} from '@/lib/services/branch-service'
import { ChurchService } from '@/lib/services/church-service'
import { UserService } from '@/lib/services/user-service'
import {
  normalizeLevel,
  resolveBranchScope,
  hasGlobalChurchAccess,
} from '@/lib/services/branch-scope'
import {
  getHierarchyLevelLabels,
  getHierarchyLevels,
  findChildLevelKey,
} from '@/lib/services/branch-hierarchy'

const resolveParentFilter = (raw: string | null): { applied: boolean; value: string | null } => {
  if (raw === null) {
    return { applied: false, value: null }
  }

  if (raw === '' || raw.toLowerCase() === 'null') {
    return { applied: true, value: null }
  }

  return { applied: true, value: raw }
}

/**
 * GET /api/churches/[churchId]/branches
 * Get all branches for a church
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ churchId: string }> }
) {
  try {
    const { churchId } = await params
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const church = await ChurchService.findById(churchId)
    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 })
    }

    const hierarchyLabels = getHierarchyLevelLabels(church)
    const { branches: allBranches, scope } = await resolveBranchScope(churchId, user)
    const url = new URL(request.url)
    const searchParams = url.searchParams
    const levelParam = normalizeLevel(searchParams.get('level'))
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const parentFilter = resolveParentFilter(searchParams.get('parentBranchId'))

    const visibleBranches = includeInactive
      ? allBranches
      : allBranches.filter((branch) => branch.isActive)

    const filtered = visibleBranches.filter((branch) => {
      if (scope && scope.size > 0 && !scope.has(branch.id)) {
        return false
      }
      if (scope && scope.size === 0) {
        return false
      }

      if (levelParam && branch.level !== levelParam) {
        return false
      }

      if (parentFilter.applied) {
        const parentValue = branch.parentBranchId ?? null
        if (parentFilter.value === null) {
          if (parentValue !== null) return false
        } else if (parentValue !== parentFilter.value) {
          return false
        }
      }

      return true
    })

    const enriched = filtered.map((branch) => ({
      ...branch,
      levelLabel: branch.levelLabel ?? hierarchyLabels[branch.level],
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error fetching branches:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
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
  { params }: { params: Promise<{ churchId: string }> }
) {
  try {
    const { churchId } = await params
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

    const church = await ChurchService.findById(churchId)
    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 })
    }

    if (user.churchId !== churchId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      address,
      city,
      state,
      zipCode,
      country,
      phone,
      email,
      description,
      adminId,
      level: rawLevel,
      parentBranchId: rawParentId,
      levelLabel: rawLevelLabel,
    } = body

    const { branchMap, scope } = await resolveBranchScope(churchId, user)
    const hierarchyLevels = getHierarchyLevels(church)
    const hierarchyLabels = hierarchyLevels.reduce<Record<string, string>>((acc, level) => {
      acc[level.key] = level.label
      return acc
    }, getHierarchyLevelLabels(church))
    const rootLevel = hierarchyLevels[0]
    const canManageAll = hasGlobalChurchAccess(user, churchId)
    const requestedLevel = normalizeLevel(typeof rawLevel === 'string' ? rawLevel : null)
    const parentBranchId =
      typeof rawParentId === 'string' && rawParentId.trim().length > 0 ? rawParentId : null

    let effectiveLevel: BranchLevel
    let parentBranch: Branch | null = null

    if (parentBranchId) {
      parentBranch = branchMap.get(parentBranchId) ?? null
      if (!parentBranch) {
        return NextResponse.json({ error: 'Parent branch not found' }, { status: 404 })
      }

      const expectedChildLevel = findChildLevelKey(church, parentBranch.level)
      if (!expectedChildLevel) {
        return NextResponse.json(
          {
            error: `${
              parentBranch.levelLabel ?? hierarchyLabels[parentBranch.level] ?? parentBranch.level
            } branches cannot have further children`,
          },
          { status: 400 }
        )
      }

      if (requestedLevel && requestedLevel !== expectedChildLevel) {
        return NextResponse.json(
          {
            error: `Child branches of ${
              parentBranch.levelLabel ?? hierarchyLabels[parentBranch.level] ?? parentBranch.level
            } must be created at the ${
              hierarchyLabels[expectedChildLevel] ?? expectedChildLevel
            } level`,
          },
          { status: 400 }
        )
      }

      if (!canManageAll) {
        if (!scope || scope.size === 0 || !scope.has(parentBranchId)) {
          return NextResponse.json(
            { error: 'You do not have permission to manage this parent branch' },
            { status: 403 }
          )
        }
      }

      effectiveLevel = expectedChildLevel
    } else {
      if (!rootLevel) {
        return NextResponse.json(
          { error: 'Hierarchy levels are not configured for this church' },
          { status: 500 }
        )
      }
      effectiveLevel = requestedLevel ?? rootLevel.key

      if (effectiveLevel !== rootLevel.key) {
        return NextResponse.json(
          { error: `Top-level branches must be created at the ${rootLevel.label} level` },
          { status: 400 }
        )
      }

      if (!canManageAll) {
        return NextResponse.json(
          { error: 'Only tenant admins can create regional branches' },
          { status: 403 }
        )
      }
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Branch name is required' },
        { status: 400 }
      )
    }

    const levelLabel =
      typeof rawLevelLabel === 'string' && rawLevelLabel.trim().length > 0
        ? rawLevelLabel.trim()
        : hierarchyLabels[effectiveLevel] ?? effectiveLevel
    if (!levelLabel || levelLabel.length === 0) {
      return NextResponse.json({ error: 'Level label is required' }, { status: 400 })
    }
    if (levelLabel.length > 60) {
      return NextResponse.json(
        { error: 'Level label must be 60 characters or fewer' },
        { status: 400 }
      )
    }

    // Generate unique slug within church
    let baseSlug = generateBranchSlug(name)
    let slug = baseSlug
    let counter = 1
    
    while (true) {
      const existingBranch = await BranchService.findBySlug(churchId, slug)
      if (!existingBranch) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create branch
    const branch = await BranchService.create({
      name,
      slug,
      churchId: churchId,
      level: effectiveLevel,
      parentBranchId,
      levelLabel,
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
      if (adminUser && adminUser.churchId === churchId) {
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
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
