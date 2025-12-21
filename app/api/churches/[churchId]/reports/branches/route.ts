import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth-options'
import { AttendanceService } from '@/lib/services/attendance-service'
import { AccountingIncomeService } from '@/lib/services/accounting-income-service'
import { AccountingExpenseService } from '@/lib/services/accounting-expense-service'
import {
  resolveBranchScope,
  getDescendantBranchIds,
} from '@/lib/services/branch-scope'
import type { Branch, BranchLevel } from '@/lib/services/branch-service'
import { UserService } from '@/lib/services/user-service'

type MetricAccumulator = {
  attendanceSessions: number
  attendanceHeadcount: number
  attendanceFirstTimers: number
  memberCount: number
  financeIncome: number
  financeExpenses: number
}

type AttendanceMetrics = {
  sessions: number
  headcount: number
  firstTimers: number
}

type MemberMetrics = {
  total: number
}

type FinanceMetrics = {
  income: number
  expenses: number
  net: number
}

type BranchReportNode = {
  id: string
  name: string
  level: BranchLevel
  parentBranchId: string | null
  status: 'ACTIVE' | 'INACTIVE'
  location: {
    city: string | null
    state: string | null
    country: string | null
  }
  metrics: {
    attendance: {
      own: AttendanceMetrics
      subtree: AttendanceMetrics
    }
    members: {
      own: MemberMetrics
      subtree: MemberMetrics
    }
    finances: {
      own: FinanceMetrics
      subtree: FinanceMetrics
    }
  }
  children: BranchReportNode[]
}

const LEVEL_ORDER: BranchLevel[] = ['REGION', 'STATE', 'ZONE', 'BRANCH']

const createAccumulator = (): MetricAccumulator => ({
  attendanceSessions: 0,
  attendanceHeadcount: 0,
  attendanceFirstTimers: 0,
  memberCount: 0,
  financeIncome: 0,
  financeExpenses: 0,
})

const cloneAccumulator = (metrics: MetricAccumulator): MetricAccumulator => ({
  attendanceSessions: metrics.attendanceSessions,
  attendanceHeadcount: metrics.attendanceHeadcount,
  attendanceFirstTimers: metrics.attendanceFirstTimers,
  memberCount: metrics.memberCount,
  financeIncome: metrics.financeIncome,
  financeExpenses: metrics.financeExpenses,
})

const toAttendanceMetrics = (metrics: MetricAccumulator): AttendanceMetrics => ({
  sessions: metrics.attendanceSessions,
  headcount: metrics.attendanceHeadcount,
  firstTimers: metrics.attendanceFirstTimers,
})

const toMemberMetrics = (metrics: MetricAccumulator): MemberMetrics => ({
  total: metrics.memberCount,
})

const toFinanceMetrics = (metrics: MetricAccumulator): FinanceMetrics => ({
  income: metrics.financeIncome,
  expenses: metrics.financeExpenses,
  net: metrics.financeIncome - metrics.financeExpenses,
})

const parseDate = (value: string | null): Date | undefined => {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const clampLimit = (value: string | null, fallback: number): number => {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) return fallback
  return Math.min(Math.max(parsed, 50), 1000)
}

const filterByScope = (branches: Branch[], scope: Set<string> | null) => {
  if (!scope) return branches
  if (scope.size === 0) return []
  const scopeSet = new Set(scope)
  return branches.filter((branch) => scopeSet.has(branch.id))
}

const sortBranches = (branches: Branch[]): Branch[] => {
  const rank = new Map(LEVEL_ORDER.map((level, index) => [level, index]))
  return [...branches].sort((a, b) => {
    const levelDiff = (rank.get(a.level) ?? 0) - (rank.get(b.level) ?? 0)
    if (levelDiff !== 0) return levelDiff
    return a.name.localeCompare(b.name)
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ churchId: string }> }
) {
  try {
    const { churchId } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const user = await UserService.findById(userId)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.churchId !== churchId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const searchParams = url.searchParams
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const rootBranchId = searchParams.get('rootBranchId')
    const startDate = parseDate(searchParams.get('start'))
    const endDate = parseDate(searchParams.get('end'))

    if (startDate && endDate && endDate < startDate) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
    }

    const limit = clampLimit(searchParams.get('limit'), 500)

    const context = await resolveBranchScope(churchId, user)
    const scopedBranches = filterByScope(context.branches, context.scope)

    if (scopedBranches.length === 0) {
      return NextResponse.json({
        filters: {
          rootBranchId,
          includeInactive,
          start: startDate ? startDate.toISOString() : null,
          end: endDate ? endDate.toISOString() : null,
        },
        summary: {
          attendance: toAttendanceMetrics(createAccumulator()),
          members: toMemberMetrics(createAccumulator()),
          finances: toFinanceMetrics(createAccumulator()),
        },
        nodes: [],
        meta: { generatedAt: new Date().toISOString() },
      })
    }

    let rootBranch: Branch | null = null
    let candidateBranches = scopedBranches

    if (rootBranchId) {
      const lookup = context.branchMap.get(rootBranchId)
      if (!lookup) {
        return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
      }
      if (context.scope && (context.scope.size === 0 || !context.scope.has(rootBranchId))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      rootBranch = lookup
      const descendantIds = getDescendantBranchIds(scopedBranches, [rootBranchId])
      candidateBranches = scopedBranches.filter((branch) => descendantIds.has(branch.id))
    }

    if (!includeInactive) {
      candidateBranches = candidateBranches.filter(
        (branch) => branch.isActive || branch.id === rootBranch?.id
      )
    }

    if (rootBranch && !candidateBranches.some((branch) => branch.id === rootBranch!.id)) {
      candidateBranches = [rootBranch, ...candidateBranches]
    }

    const uniqueBranches = new Map(candidateBranches.map((branch) => [branch.id, branch]))
    candidateBranches = Array.from(uniqueBranches.values())

    if (candidateBranches.length === 0) {
      return NextResponse.json({
        filters: {
          rootBranchId,
          includeInactive,
          start: startDate ? startDate.toISOString() : null,
          end: endDate ? endDate.toISOString() : null,
        },
        summary: {
          attendance: toAttendanceMetrics(createAccumulator()),
          members: toMemberMetrics(createAccumulator()),
          finances: toFinanceMetrics(createAccumulator()),
        },
        nodes: [],
        meta: { generatedAt: new Date().toISOString() },
      })
    }

    const branchIdSet = new Set(candidateBranches.map((branch) => branch.id))

    const [users, attendanceSessions, manualIncome, expenses] = await Promise.all([
      UserService.findByChurch(churchId),
      AttendanceService.listSessionsByChurch(churchId, {
        startAt: startDate,
        endAt: endDate,
        limit,
      }),
      AccountingIncomeService.findByChurch(churchId, {
        startDate,
        endDate,
        limit,
      }),
      AccountingExpenseService.findByChurch(churchId, {
        startDate,
        endDate,
        limit,
      }),
    ])

    const baseMetrics = new Map<string, MetricAccumulator>()
    const ensureBaseEntry = (branchId: string) => {
      if (!baseMetrics.has(branchId)) {
        baseMetrics.set(branchId, createAccumulator())
      }
      return baseMetrics.get(branchId)!
    }

    users.forEach((member) => {
      const memberBranchId = member.branchId
      if (!memberBranchId || !branchIdSet.has(memberBranchId)) return
      const entry = ensureBaseEntry(memberBranchId)
      entry.memberCount += 1
    })

    attendanceSessions.forEach((session) => {
      const sessionBranchId = session.branchId
      if (!sessionBranchId || !branchIdSet.has(sessionBranchId)) return
      const entry = ensureBaseEntry(sessionBranchId)
      entry.attendanceSessions += 1
      entry.attendanceHeadcount += Number(session.headcount?.total ?? 0)
      entry.attendanceFirstTimers += Number(session.headcount?.firstTimers ?? 0)
    })

    manualIncome.forEach((income) => {
      const branchId = income.branchId
      if (!branchId || !branchIdSet.has(branchId)) return
      const entry = ensureBaseEntry(branchId)
      entry.financeIncome += Number(income.amount || 0)
    })

    expenses.forEach((expense) => {
      const branchId = expense.branchId
      if (!branchId || !branchIdSet.has(branchId)) return
      const entry = ensureBaseEntry(branchId)
      entry.financeExpenses += Number(expense.amount || 0)
    })

    const childrenByParent = new Map<string | null, Branch[]>()
    candidateBranches.forEach((branch) => {
      const parentId =
        branch.parentBranchId && branchIdSet.has(branch.parentBranchId)
          ? branch.parentBranchId
          : null
      const siblings = childrenByParent.get(parentId) ?? []
      siblings.push(branch)
      childrenByParent.set(parentId, siblings)
    })

    // Ensure deterministic ordering for siblings
    childrenByParent.forEach((list, key) => {
      childrenByParent.set(key, sortBranches(list))
    })

    const aggregatedMetrics = new Map<string, MetricAccumulator>()
    const computeTotals = (branchId: string): MetricAccumulator => {
      if (aggregatedMetrics.has(branchId)) {
        return aggregatedMetrics.get(branchId)!
      }
      const own = baseMetrics.get(branchId) ?? createAccumulator()
      const totals = cloneAccumulator(own)
      const children = childrenByParent.get(branchId) ?? []
      children.forEach((child) => {
        const childTotals = computeTotals(child.id)
        totals.attendanceSessions += childTotals.attendanceSessions
        totals.attendanceHeadcount += childTotals.attendanceHeadcount
        totals.attendanceFirstTimers += childTotals.attendanceFirstTimers
        totals.memberCount += childTotals.memberCount
        totals.financeIncome += childTotals.financeIncome
        totals.financeExpenses += childTotals.financeExpenses
      })
      aggregatedMetrics.set(branchId, totals)
      return totals
    }

    const buildNode = (branch: Branch): BranchReportNode => {
      const own = baseMetrics.get(branch.id) ?? createAccumulator()
      const subtree = computeTotals(branch.id)
      const children = (childrenByParent.get(branch.id) ?? []).map(buildNode)

      return {
        id: branch.id,
        name: branch.name,
        level: branch.level,
        parentBranchId: branch.parentBranchId ?? null,
        status: branch.isActive ? 'ACTIVE' : 'INACTIVE',
        location: {
          city: branch.city ?? null,
          state: branch.state ?? null,
          country: branch.country ?? null,
        },
        metrics: {
          attendance: {
            own: toAttendanceMetrics(own),
            subtree: toAttendanceMetrics(subtree),
          },
          members: {
            own: toMemberMetrics(own),
            subtree: toMemberMetrics(subtree),
          },
          finances: {
            own: toFinanceMetrics(own),
            subtree: toFinanceMetrics(subtree),
          },
        },
        children,
      }
    }

    const topLevelBranches = rootBranch
      ? [uniqueBranches.get(rootBranch.id)!]
      : childrenByParent.get(null) ?? []

    const nodes = topLevelBranches.map(buildNode)

    const summaryAccumulator = nodes.reduce((acc, node) => {
      acc.attendanceSessions += node.metrics.attendance.subtree.sessions
      acc.attendanceHeadcount += node.metrics.attendance.subtree.headcount
      acc.attendanceFirstTimers += node.metrics.attendance.subtree.firstTimers
      acc.memberCount += node.metrics.members.subtree.total
      acc.financeIncome += node.metrics.finances.subtree.income
      acc.financeExpenses += node.metrics.finances.subtree.expenses
      return acc
    }, createAccumulator())

    return NextResponse.json({
      filters: {
        rootBranchId: rootBranch ? rootBranch.id : null,
        includeInactive,
        start: startDate ? startDate.toISOString() : null,
        end: endDate ? endDate.toISOString() : null,
      },
      summary: {
        attendance: toAttendanceMetrics(summaryAccumulator),
        members: toMemberMetrics(summaryAccumulator),
        finances: toFinanceMetrics(summaryAccumulator),
      },
      nodes,
      meta: { generatedAt: new Date().toISOString(), totalBranches: branchIdSet.size },
    })
  } catch (error: any) {
    console.error('Branch reports error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
