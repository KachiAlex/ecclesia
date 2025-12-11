import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const quickActions = [
    {
      title: 'Sermons',
      description: 'Watch and download sermons',
      href: '/sermons',
      icon: '📺',
      gradient: 'from-purple-500 to-violet-600',
      count: '50+',
    },
    {
      title: 'Prayer Wall',
      description: 'Post and pray for requests',
      href: '/prayer',
      icon: '🙏',
      gradient: 'from-blue-500 to-cyan-600',
      count: '12',
    },
    {
      title: 'Giving',
      description: 'Give to projects and tithes',
      href: '/giving',
      icon: '💰',
      gradient: 'from-green-500 to-emerald-600',
      count: 'Active',
    },
    {
      title: 'Events',
      description: 'View and register for events',
      href: '/events',
      icon: '📅',
      gradient: 'from-orange-500 to-amber-600',
      count: '5',
    },
    {
      title: 'Community',
      description: 'Connect with members',
      href: '/community',
      icon: '💬',
      gradient: 'from-pink-500 to-rose-600',
      count: '200+',
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

  const stats = [
    { label: 'Sermons Watched', value: '24', change: '+12%' },
    { label: 'Prayer Requests', value: '8', change: '+3' },
    { label: 'Giving This Month', value: '$1,250', change: '+15%' },
    { label: 'Events Attended', value: '6', change: '+2' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <span className="text-sm font-semibold text-green-600">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center text-2xl shadow-lg`}
                >
                  {action.icon}
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
                  {action.count}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {action.title}
              </h3>
              <p className="text-gray-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { action: 'Watched sermon', title: 'Faith in Action', time: '2 hours ago' },
            { action: 'Prayed for', title: 'Healing Request', time: '5 hours ago' },
            { action: 'Gave to', title: 'Building Fund', time: '1 day ago' },
            { action: 'Registered for', title: 'Sunday Service', time: '2 days ago' },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {activity.action.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {activity.action} <span className="text-blue-600">{activity.title}</span>
                </p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
