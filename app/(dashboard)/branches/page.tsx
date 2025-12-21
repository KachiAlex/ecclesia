'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

import CreateBranchModal from '@/components/branches/CreateBranchModal'
import BranchAdminModal from '@/components/branches/BranchAdminModal'

const BRANCH_LEVELS = ['REGION', 'STATE', 'ZONE', 'BRANCH'] as const
type BranchLevel = (typeof BRANCH_LEVELS)[number]

const CHILD_LEVEL_MAP: Record<BranchLevel, BranchLevel | null> = {
  REGION: 'STATE',
  STATE: 'ZONE',
  ZONE: 'BRANCH',
  BRANCH: null,
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

type BranchSummary = {
  attendance: AttendanceMetrics
  members: MemberMetrics
  finances: FinanceMetrics
}

type FilterState = {
  start: string
  end: string
  includeInactive: boolean
}

type BranchCreationContext = {
  level: BranchLevel
  parentBranchId?: string | null
  parentName?: string
}

const DEFAULT_FILTERS: FilterState = {
  start: '',
  end: '',
  includeInactive: false,
}

const formatNumber = (value: number) => value.toLocaleString()

export default function BranchesPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string | undefined

  const [churchId, setChurchId] = useState<string | null>(null)
  const [nodes, setNodes] = useState<BranchReportNode[]>([])
  const [summary, setSummary] = useState<BranchSummary | null>(null)
  const [meta, setMeta] = useState<{ generatedAt: string; totalBranches: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filterInputs, setFilterInputs] = useState<FilterState>(DEFAULT_FILTERS)
  const [activeFilters, setActiveFilters] = useState<FilterState>(DEFAULT_FILTERS)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creationContext, setCreationContext] = useState<BranchCreationContext | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<{ id: string; name: string } | null>(null)
  const [showAdminModal, setShowAdminModal] = useState(false)

  const canManageHierarchy = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_ADMIN'].includes(role || '')
  const canCreateRegions = ['SUPER_ADMIN', 'ADMIN'].includes(role || '')

  const loadChurchContext = useCallback(async () => {
    try {
      const res = await fetch('/api/users/me')
      if (!res.ok) {
        throw new Error('Unable to resolve user')
      }
      const data = await res.json()
      if (data.churchId) {
        setChurchId(data.churchId)
      } else {
        setError('No church found for your account.')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to load user context')
    }
  }, [])

  const fetchHierarchy = useCallback(
    async (targetChurchId: string, filters: FilterState) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (filters.start) params.set('start', filters.start)
        if (filters.end) params.set('end', filters.end)
        if (filters.includeInactive) params.set('includeInactive', 'true')
        params.set('limit', '750')

        const res = await fetch(`/api/churches/${targetChurchId}/reports/branches?${params.toString()}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to load hierarchy')
        }

        const data = await res.json()
        setNodes(Array.isArray(data.nodes) ? data.nodes : [])
        setSummary(data.summary || null)
        setMeta(data.meta || null)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Failed to load hierarchy')
        setNodes([])
        setSummary(null)
        setMeta(null)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (session) {
      loadChurchContext()
    }
  }, [session, loadChurchContext])

  useEffect(() => {
    if (churchId) {
      fetchHierarchy(churchId, activeFilters)
    }
  }, [churchId, activeFilters, fetchHierarchy])

  const handleApplyFilters = () => {
    if (filterInputs.start && filterInputs.end && filterInputs.end < filterInputs.start) {
      setError('End date must be after start date.')
      return
    }
    setActiveFilters(filterInputs)
  }

  const handleResetFilters = () => {
    setFilterInputs(DEFAULT_FILTERS)
    setActiveFilters(DEFAULT_FILTERS)
  }

  const handleBranchCreated = () => {
    setShowCreateModal(false)
    if (churchId) {
      fetchHierarchy(churchId, activeFilters)
    }
  }

  const handleOpenCreateModal = (context?: BranchCreationContext) => {
    setCreationContext(context ?? { level: 'REGION', parentBranchId: null })
    setShowCreateModal(true)
  }

  const handleManageAdmins = (branch: { id: string; name: string }) => {
    setSelectedBranch(branch)
    setShowAdminModal(true)
  }

  const handleDeleteBranch = async (branch: BranchReportNode) => {
    if (!churchId) return
    const confirmed = window.confirm(
      `Delete ${branch.name}? This affects ${branch.metrics.members.subtree.total.toLocaleString()} members tracked under it.`
    )
    if (!confirmed) return

    try {
      const res = await fetch(`/api/churches/${churchId}/branches/${branch.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete branch')
      }
      fetchHierarchy(churchId, activeFilters)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to delete branch')
    }
  }

  const handleExportReport = async () => {
    if (!churchId) return
    try {
      const params = new URLSearchParams()
      if (activeFilters.start) params.set('start', activeFilters.start)
      if (activeFilters.end) params.set('end', activeFilters.end)
      if (activeFilters.includeInactive) params.set('includeInactive', 'true')
      params.set('limit', '750')

      const res = await fetch(`/api/churches/${churchId}/reports/branches?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Unable to export hierarchy')
      }
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `branch-report-${new Date().toISOString()}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to export hierarchy')
    }
  }

  const renderNode = (node: BranchReportNode, depth: number = 0) => {
    const childLevel = CHILD_LEVEL_MAP[node.level]
    const locationParts = [node.location.city, node.location.state, node.location.country].filter(Boolean)
    const location = locationParts.length > 0 ? locationParts.join(', ') : 'Location not specified'

    return (
      <div key={node.id} className="space-y-3">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-semibold text-gray-900">{node.name}</h3>
                <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full bg-slate-100 text-slate-700">
                  {node.level}
                </span>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    node.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {node.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{location}</p>
            </div>
            {canManageHierarchy && (
              <div className="flex flex-wrap gap-2">
                {childLevel && (
                  <button
                    onClick={() =>
                      handleOpenCreateModal({
                        level: childLevel,
                        parentBranchId: node.id,
                        parentName: node.name,
                      })
                    }
                    className="px-4 py-2 rounded-xl border border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-50 transition-colors"
                  >
                    + Add {childLevel.toLowerCase()}
                  </button>
                )}
                <button
                  onClick={() => handleManageAdmins({ id: node.id, name: node.name })}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Manage admins
                </button>
                <button
                  onClick={() => handleDeleteBranch(node)}
                  className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-5">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Attendance</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatNumber(node.metrics.attendance.subtree.headcount)}{' '}
                <span className="text-base font-medium text-slate-500">people</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {formatNumber(node.metrics.attendance.subtree.sessions)} sessions •{' '}
                {formatNumber(node.metrics.attendance.subtree.firstTimers)} first timers
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Own campus: {formatNumber(node.metrics.attendance.own.headcount)}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-600">Members</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                {formatNumber(node.metrics.members.subtree.total)}
              </p>
              <p className="text-xs text-emerald-600 mt-2">
                Own campus: {formatNumber(node.metrics.members.own.total)}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase text-amber-700">Finances</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                ₦{formatNumber(Math.round(node.metrics.finances.subtree.net))}
              </p>
              <p className="text-xs text-amber-600 mt-2">
                Income ₦{formatNumber(Math.round(node.metrics.finances.subtree.income))} • Expenses ₦
                {formatNumber(Math.round(node.metrics.finances.subtree.expenses))}
              </p>
            </div>
          </div>
        </div>

        {node.children.length > 0 && (
          <div className="pl-6 md:pl-10 border-l border-dashed border-gray-300 space-y-4">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Branch hierarchy</h1>
          <p className="text-gray-600 mt-1">
            Regions, states, zones, and branches with scoped reporting.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportReport}
            className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Export report
          </button>
          {canCreateRegions && churchId && (
            <button
              onClick={() => handleOpenCreateModal()}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              + New region
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase">Start date</label>
            <input
              type="date"
              value={filterInputs.start}
              onChange={(e) => setFilterInputs((prev) => ({ ...prev, start: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-900"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase">End date</label>
            <input
              type="date"
              value={filterInputs.end}
              onChange={(e) => setFilterInputs((prev) => ({ ...prev, end: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-900"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={filterInputs.includeInactive}
              onChange={(e) =>
                setFilterInputs((prev) => ({ ...prev, includeInactive: e.target.checked }))
              }
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Include inactive branches
          </label>
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-white"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          {error}
        </div>
      )}

      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Attendance (subtree)</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {formatNumber(summary.attendance.headcount)}
            </p>
            <p className="text-sm text-slate-500">
              {formatNumber(summary.attendance.sessions)} sessions •{' '}
              {formatNumber(summary.attendance.firstTimers)} first timers
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Members</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {formatNumber(summary.members.total)}
            </p>
            <p className="text-sm text-slate-500">Across all visible branches</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Financial net</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              ₦{formatNumber(Math.round(summary.finances.net))}
            </p>
            <p className="text-sm text-slate-500">
              Income ₦{formatNumber(Math.round(summary.finances.income))} • Expenses ₦
              {formatNumber(Math.round(summary.finances.expenses))}
            </p>
          </div>
        </div>
      )}

      {meta && (
        <p className="text-xs text-slate-500">
          Snapshot generated {new Date(meta.generatedAt).toLocaleString()} •{' '}
          {meta.totalBranches} branches in scope
        </p>
      )}

      {nodes.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
          <div className="text-5xl mb-4">🌱</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">No branches to show</h3>
          <p className="text-gray-600 max-w-lg mx-auto">
            Create your first region or request access to a parent branch to begin building the
            hierarchy.
          </p>
          {canCreateRegions && (
            <button
              onClick={() => handleOpenCreateModal()}
              className="mt-6 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
            >
              Create region
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">{nodes.map((node) => renderNode(node))}</div>
      )}

      {showCreateModal && churchId && creationContext && (
        <CreateBranchModal
          churchId={churchId}
          context={creationContext}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleBranchCreated}
        />
      )}

      {showAdminModal && selectedBranch && churchId && (
        <BranchAdminModal
          churchId={churchId}
          branchId={selectedBranch.id}
          branchName={selectedBranch.name}
          onClose={() => {
            setShowAdminModal(false)
            setSelectedBranch(null)
          }}
        />
      )}
    </div>
  )
}

