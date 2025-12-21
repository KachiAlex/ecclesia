import {
  BranchService,
  BranchAdminService,
  BRANCH_LEVELS,
  BranchLevel,
  Branch,
} from '@/lib/services/branch-service'
import type { User } from '@/lib/services/user-service'

export const CHILD_LEVEL_MAP: Record<BranchLevel, BranchLevel | null> = {
  REGION: 'STATE',
  STATE: 'ZONE',
  ZONE: 'BRANCH',
  BRANCH: null,
}

export const isValidBranchLevel = (value: string | null): value is BranchLevel => {
  if (!value) return false
  const upper = value.toUpperCase()
  return BRANCH_LEVELS.includes(upper as BranchLevel)
}

export const normalizeLevel = (value: string | null): BranchLevel | null => {
  if (!value) return null
  const upper = value.toUpperCase()
  return BRANCH_LEVELS.includes(upper as BranchLevel) ? (upper as BranchLevel) : null
}

export const getDescendantBranchIds = (branches: Branch[], rootIds: string[]): Set<string> => {
  const childrenMap = new Map<string, Branch[]>()
  for (const branch of branches) {
    if (!branch.parentBranchId) continue
    const siblings = childrenMap.get(branch.parentBranchId) ?? []
    siblings.push(branch)
    childrenMap.set(branch.parentBranchId, siblings)
  }

  const accessible = new Set<string>()
  const queue: string[] = []

  for (const id of rootIds) {
    accessible.add(id)
    queue.push(id)
  }

  while (queue.length > 0) {
    const current = queue.shift()!
    const children = childrenMap.get(current) ?? []
    for (const child of children) {
      if (accessible.has(child.id)) continue
      accessible.add(child.id)
      queue.push(child.id)
    }
  }

  return accessible
}

export const hasGlobalChurchAccess = (user: User, churchId: string) =>
  user.role === 'SUPER_ADMIN' || (user.role === 'ADMIN' && user.churchId === churchId)

export type BranchScopeContext = {
  branches: Branch[]
  branchMap: Map<string, Branch>
  scope: Set<string> | null
}

export const resolveBranchScope = async (
  churchId: string,
  user: User
): Promise<BranchScopeContext> => {
  const branches = await BranchService.findByChurch(churchId, { includeInactive: true })
  const branchMap = new Map(branches.map((branch) => [branch.id, branch]))

  if (hasGlobalChurchAccess(user, churchId)) {
    return { branches, branchMap, scope: null }
  }

  if (user.role !== 'BRANCH_ADMIN') {
    return { branches, branchMap, scope: null }
  }

  const assignments = await BranchAdminService.findByUser(user.id)
  const rootBranchIds = assignments
    .map((assignment) => assignment.branchId)
    .filter(
      (branchId) => branchMap.has(branchId) && branchMap.get(branchId)!.churchId === churchId
    )

  if (rootBranchIds.length === 0 && user.branchId && branchMap.has(user.branchId)) {
    rootBranchIds.push(user.branchId)
  }

  if (rootBranchIds.length === 0) {
    return { branches, branchMap, scope: new Set<string>() }
  }

  const scope = getDescendantBranchIds(branches, rootBranchIds)
  return { branches, branchMap, scope }
}

export const hasBranchAccess = (
  context: BranchScopeContext,
  branchId: string
): { branch: Branch | null; allowed: boolean } => {
  const branch = context.branchMap.get(branchId) ?? null
  if (!branch) {
    return { branch: null, allowed: false }
  }

  const { scope } = context
  if (scope && scope.size === 0) {
    return { branch, allowed: false }
  }

  if (scope && !scope.has(branchId)) {
    return { branch, allowed: false }
  }

  return { branch, allowed: true }
}

