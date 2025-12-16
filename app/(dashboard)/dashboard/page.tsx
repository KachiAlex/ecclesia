'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface DashboardStats {
  sermonsWatched: { value: number; change: string }
  prayerRequests: { value: number; change: string }
  giving: { value: string; change: string }
  eventsAttended: { value: number; change: string }
}

interface QuickActions {
  sermons: number
  prayer: number
  giving: number
  events: number
  community: number
}

interface RecentActivity {
  id: string
  type: 'sermon' | 'prayer' | 'giving' | 'event'
  title: string
  createdAt: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [quickActions, setQuickActions] = useState<QuickActions | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/activity'),
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
        setQuickActions(data.quickActions)
      }

      if (activityRes.ok) {
        const data = await activityRes.json()
        setRecentActivity(data.slice(0, 5))
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatActivityTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    } else {
      return formatDate(dateString)
    }
  }

  const getActivityAction = (type: string) => {
    switch (type) {
      case 'sermon':
        return 'Watched sermon'
      case 'prayer':
        return 'Prayed for'
      case 'giving':
        return 'Gave to'
      case 'event':
        return 'Registered for'
      default:
        return 'Activity'
    }
  }

  const getActivityIcon = (type: string) => {
    const iconMap: Record<string, { gradient: string; icon: string }> = {
      sermon: { gradient: 'from-purple-500 to-violet-600', icon: '📺' },
      prayer: { gradient: 'from-blue-500 to-cyan-600', icon: '🙏' },
      giving: { gradient: 'from-green-500 to-emerald-600', icon: '💰' },
      event: { gradient: 'from-orange-500 to-amber-600', icon: '📅' },
    }
    return iconMap[type] || { gradient: 'from-gray-500 to-gray-600', icon: '✨' }
  }

  const quickActionsList = [
    {
      title: 'Sermons',
      description: 'Watch and download sermons',
      href: '/sermons',
      icon: '📺',
      gradient: 'from-purple-500 to-violet-600',
      count: quickActions?.sermons || 0,
    },
    {
      title: 'Prayer Wall',
      description: 'Post and pray for requests',
      href: '/prayer',
      icon: '🙏',
      gradient: 'from-blue-500 to-cyan-600',
      count: quickActions?.prayer || 0,
    },
    {
      title: 'Giving',
      description: 'Give to projects and tithes',
      href: '/giving',
      icon: '💰',
      gradient: 'from-green-500 to-emerald-600',
      count: quickActions?.giving || 0,
    },
    {
      title: 'Events',
      description: 'View and register for events',
      href: '/events',
      icon: '📅',
      gradient: 'from-orange-500 to-amber-600',
      count: quickActions?.events || 0,
    },
    {
      title: 'Community',
      description: 'Connect with members',
      href: '/community',
      icon: '💬',
      gradient: 'from-pink-500 to-rose-600',
      count: quickActions?.community || 0,
    },
    {
      title: 'AI Coaching',
      description: 'Get personalized growth plans',
      href: '/ai/coaching',
      icon: '🤖',
      gradient: 'from-indigo-500 to-purple-600',
      count: 'New',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-16 w-16 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const statsList = stats
    ? [
        {
          label: 'Sermons Watched',
          value: stats.sermonsWatched.value.toString(),
          change: stats.sermonsWatched.change,
          icon: '📺',
          gradient: 'from-purple-500 to-violet-600',
        },
        {
          label: 'Prayer Requests',
          value: stats.prayerRequests.value.toString(),
          change: stats.prayerRequests.change,
          icon: '🙏',
          gradient: 'from-blue-500 to-cyan-600',
        },
        {
          label: 'Giving This Month',
          value: stats.giving.value,
          change: stats.giving.change,
          icon: '💰',
          gradient: 'from-green-500 to-emerald-600',
        },
        {
          label: 'Events Attended',
          value: stats.eventsAttended.value.toString(),
          change: stats.eventsAttended.change,
          icon: '📅',
          gradient: 'from-orange-500 to-amber-600',
        },
      ]
    : []

  return (
    <div className="space-y-8 max-w-[1600px]">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsList.map((stat, index) => (
          <div
            key={index}
            className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
          >
            {/* Icon */}
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} text-white text-2xl mb-4 shadow-lg shadow-${stat.gradient.split('-')[1]}-500/20 group-hover:scale-110 transition-transform duration-300`}>
              {stat.icon}
            </div>
            
            {/* Label */}
            <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
            
            {/* Value and Change */}
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <span
                className={`text-sm font-semibold px-2.5 py-1 rounded-lg ${
                  stat.change.startsWith('+')
                    ? 'text-green-700 bg-green-50'
                    : 'text-gray-600 bg-gray-50'
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <p className="text-sm text-gray-600 mt-1">Access your favorite features</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActionsList.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Background Gradient Effect */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 rounded-full blur-2xl transition-opacity duration-300 -mr-16 -mt-16`}></div>
              
              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${action.gradient} text-white text-3xl mb-4 shadow-lg shadow-${action.gradient.split('-')[1]}-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  {action.icon}
                </div>

                {/* Count Badge */}
                {action.count !== 0 && (
                  <div className="absolute top-0 right-0">
                    <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-white rounded-full ${
                      action.count === 'New' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse' 
                        : 'bg-gradient-to-r from-gray-600 to-gray-700'
                    }`}>
                      {action.count}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-gray-800">
                  {action.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 group-hover:text-gray-700">
                  {action.description}
                </p>

                {/* Arrow Icon */}
                <div className="mt-4 flex items-center text-sm font-semibold text-gray-400 group-hover:text-gray-600 transition-colors">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Go →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
            <p className="text-sm text-gray-600 mt-1">Your latest interactions</p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <span className="text-3xl">✨</span>
            </div>
            <p className="text-gray-600 font-medium mb-1">No recent activity yet</p>
            <p className="text-sm text-gray-500">Start engaging with sermons, prayer, giving, and events!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const { gradient, icon } = getActivityIcon(activity.type)
              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 mb-0.5">
                      {getActivityAction(activity.type)}
                    </p>
                    <p className="text-sm text-blue-600 font-medium truncate">
                      {activity.title}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="flex-shrink-0 text-sm text-gray-500">
                    {formatActivityTime(activity.createdAt)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
