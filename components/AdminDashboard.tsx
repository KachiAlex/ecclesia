'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Analytics {
  overview: {
    totalUsers: number
    activeUsers: number
    sermonViews: number
    prayerRequests: number
    totalGiving: number
    eventsCount: number
    checkIns: number
    recentPosts: number
  }
  usersByRole: Array<{
    role: string
    count: number
  }>
  disengagedUsers: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    lastLoginAt?: string
    role: string
  }>
}

interface FirstTimer {
  id: string
  firstName: string
  lastName: string
  email: string
  createdAt: string
  daysSinceJoined: number
  hasMentor: boolean
  hasActivity: boolean
  status: string
  _count: {
    eventsAttended: number
    sermonsWatched: number
    giving: number
    followUps: number
  }
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [firstTimers, setFirstTimers] = useState<FirstTimer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'disengaged' | 'first-timers'>('overview')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [analyticsRes, firstTimersRes] = await Promise.all([
        fetch('/api/admin/analytics'),
        fetch('/api/admin/first-timers'),
      ])

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setAnalytics(analyticsData)
      }

      if (firstTimersRes.ok) {
        const firstTimersData = await firstTimersRes.json()
        setFirstTimers(firstTimersData.firstTimers)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-2 border-b-2 ${
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('disengaged')}
            className={`pb-4 px-2 border-b-2 ${
              activeTab === 'disengaged'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Disengaged ({analytics?.disengagedUsers.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('first-timers')}
            className={`pb-4 px-2 border-b-2 ${
              activeTab === 'first-timers'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            First-Timers ({firstTimers.length})
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Total Users</div>
              <div className="text-3xl font-bold">{analytics.overview.totalUsers}</div>
              <div className="text-sm text-gray-500 mt-1">
                {analytics.overview.activeUsers} active this month
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Sermon Views</div>
              <div className="text-3xl font-bold">{analytics.overview.sermonViews}</div>
              <div className="text-sm text-gray-500 mt-1">This month</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Total Giving</div>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(analytics.overview.totalGiving)}
              </div>
              <div className="text-sm text-gray-500 mt-1">This month</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Prayer Requests</div>
              <div className="text-3xl font-bold">{analytics.overview.prayerRequests}</div>
              <div className="text-sm text-gray-500 mt-1">This month</div>
            </div>
          </div>

          {/* Users by Role */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Users by Role</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {analytics.usersByRole.map((role) => (
                <div key={role.role} className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">{role.role}</div>
                  <div className="text-2xl font-bold">{role.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Summary */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Events</div>
              <div className="text-2xl font-bold">{analytics.overview.eventsCount}</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Check-ins</div>
              <div className="text-2xl font-bold">{analytics.overview.checkIns}</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Posts</div>
              <div className="text-2xl font-bold">{analytics.overview.recentPosts}</div>
            </div>
          </div>
        </div>
      )}

      {/* Disengaged Users Tab */}
      {activeTab === 'disengaged' && analytics && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Disengaged Members</h2>
            <p className="text-sm text-gray-600 mt-1">
              Members who haven't logged in for 30+ days
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.disengagedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No disengaged members found
                    </td>
                  </tr>
                ) : (
                  analytics.disengagedUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLoginAt
                          ? formatDate(user.lastLoginAt)
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/dashboard/users/${user.id}`}
                          className="text-primary-600 hover:underline text-sm"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* First-Timers Tab */}
      {activeTab === 'first-timers' && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">First-Timer Pipeline</h2>
            <p className="text-sm text-gray-600 mt-1">
              Visitors who joined in the last 90 days
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Visitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Days Since Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {firstTimers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No first-timers in the last 90 days
                    </td>
                  </tr>
                ) : (
                  firstTimers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.daysSinceJoined} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            user.status === 'ENGAGED'
                              ? 'bg-green-100 text-green-800'
                              : user.status === 'ASSIGNED'
                              ? 'bg-blue-100 text-blue-800'
                              : user.status === 'NEEDS_FOLLOWUP'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user._count.eventsAttended} events •{' '}
                        {user._count.sermonsWatched} sermons •{' '}
                        {user._count.followUps} follow-ups
                        {user.hasMentor && ' • Has mentor'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/dashboard/users/${user.id}`}
                          className="text-primary-600 hover:underline text-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

