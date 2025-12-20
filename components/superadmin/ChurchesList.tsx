'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import TenantDetailModal from './TenantDetailModal'

interface Church {
  id: string
  name: string
  slug?: string
  city?: string
  country?: string
  createdAt: string
  userCount: number
  subscriptionStatus: string
}

interface ChurchesListProps {
  churches: Church[]
}

export default function ChurchesList({ churches: initialChurches }: ChurchesListProps) {
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'created',
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null)
  const router = useRouter()

  const filteredAndSortedChurches = useMemo(() => {
    let filtered = [...initialChurches]

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter((church) => church.subscriptionStatus === filters.status)
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (church) =>
          church.name.toLowerCase().includes(searchLower) ||
          church.slug?.toLowerCase().includes(searchLower) ||
          church.city?.toLowerCase().includes(searchLower) ||
          church.country?.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'created-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'name':
          return a.name.localeCompare(b.name)
        case 'members':
          return b.userCount - a.userCount
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return filtered
  }, [initialChurches, filters])

  const handleRefresh = () => {
    router.refresh()
  }

  const handleManageClick = async (churchId: string) => {
    setModalOpen(true)
    setDetailLoading(true)
    setDetailError('')
    setSelectedDetail(null)

    try {
      const response = await fetch(`/api/superadmin/churches/${churchId}`)
      if (!response.ok) {
        throw new Error('Unable to fetch tenant details')
      }
      const data = await response.json()
      setSelectedDetail(data)
    } catch (error: any) {
      setDetailError(error.message || 'Failed to load tenant')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedDetail(null)
    setDetailError('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'TRIAL':
        return 'bg-blue-100 text-blue-800'
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      case 'SUSPENDED':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search churches..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="TRIAL">Trial</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="created">Newest First</option>
              <option value="created-asc">Oldest First</option>
              <option value="name">Name A-Z</option>
              <option value="members">Most Members</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredAndSortedChurches.length} of {initialChurches.length} churches
      </div>

      {/* Churches Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Church
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedChurches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No churches found matching your filters
                  </td>
                </tr>
              ) : (
                filteredAndSortedChurches.map((church) => (
                  <tr key={church.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{church.name}</div>
                        {church.slug && (
                          <div className="text-sm text-gray-500">/{church.slug}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {church.city && <div>{church.city}</div>}
                        {church.country && <div className="text-gray-500">{church.country}</div>}
                        {!church.city && !church.country && (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{church.userCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          church.subscriptionStatus
                        )}`}
                      >
                        {church.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(church.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleManageClick(church.id)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Manage →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TenantDetailModal
        open={modalOpen}
        loading={detailLoading}
        error={detailError}
        data={selectedDetail}
        onClose={handleCloseModal}
        onRefresh={handleRefresh}
      />
    </div>
  )
}

