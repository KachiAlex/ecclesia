'use client'

import { useState } from 'react'

interface ChurchFiltersProps {
  onFilterChange: (filters: {
    status: string
    search: string
    sortBy: string
  }) => void
}

export default function ChurchFilters({ onFilterChange }: ChurchFiltersProps) {
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created')

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    onFilterChange({ status: newStatus, search, sortBy })
  }

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch)
    onFilterChange({ status, search: newSearch, sortBy })
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    onFilterChange({ status, search, sortBy: newSort })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="grid md:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search churches..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
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
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
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
  )
}

