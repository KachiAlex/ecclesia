'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', gradient: 'from-blue-500 to-indigo-600' },
  { name: 'Meetings', href: '/meetings', icon: '🔴', gradient: 'from-red-500 to-rose-600' },
  { name: 'Sermons', href: '/sermons', icon: '📺', gradient: 'from-purple-500 to-violet-600' },
  { name: 'Prayer', href: '/prayer', icon: '🙏', gradient: 'from-blue-500 to-cyan-600' },
  { name: 'Giving', href: '/giving', icon: '💰', gradient: 'from-green-500 to-emerald-600' },
  { name: 'Accounting', href: '/accounting', icon: '🧾', gradient: 'from-slate-600 to-gray-700' },
  { name: 'Attendance', href: '/attendance', icon: '🧍', gradient: 'from-teal-600 to-cyan-700' },
  { name: 'Reports', href: '/reports', icon: '📑', gradient: 'from-indigo-500 to-slate-600' },
  { name: 'Events', href: '/events', icon: '📅', gradient: 'from-orange-500 to-amber-600' },
  { name: 'Community', href: '/community', icon: '💬', gradient: 'from-pink-500 to-rose-600' },
  { name: 'Messages', href: '/messages', icon: '✉️', gradient: 'from-indigo-500 to-purple-600' },
  { name: 'Groups', href: '/groups', icon: '👥', gradient: 'from-teal-500 to-cyan-600' },
  { name: 'Reading Plans', href: '/reading-plans', icon: '📖', gradient: 'from-amber-500 to-orange-600' },
  { name: 'Digital School', href: '/digital-school', icon: '🎓', gradient: 'from-violet-500 to-fuchsia-600' },
  { name: 'Leaderboard', href: '/leaderboard', icon: '🏆', gradient: 'from-yellow-500 to-orange-600' },
  { name: 'Users', href: '/users', icon: '👤', gradient: 'from-gray-600 to-gray-700' },
  { name: 'Branches', href: '/branches', icon: '🏢', gradient: 'from-blue-600 to-indigo-700' },
  { name: 'Payroll', href: '/payroll', icon: '💵', gradient: 'from-green-600 to-emerald-700' },
]

interface DashboardNavProps {
  userRole?: string
  isStaff?: boolean
}

export default function DashboardNav({ userRole, isStaff = false }: DashboardNavProps) {
  const pathname = usePathname()

  const canSeeUsers = userRole !== 'MEMBER'
  const canSeePayroll = userRole !== 'MEMBER' || (userRole === 'MEMBER' && isStaff)

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className="px-4 py-6 space-y-1.5">
      {/* Main Navigation */}
      {navigation
        .filter((item) => {
          if (item.href === '/users') return canSeeUsers
          if (item.href === '/payroll') return canSeePayroll
          return true
        })
        .map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              active
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold shadow-sm'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium'
            }`}
          >
            {/* Icon */}
            <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 ${
              active 
                ? `bg-gradient-to-br ${item.gradient} shadow-lg shadow-${item.gradient.split('-')[1]}-500/30` 
                : 'bg-gray-100 group-hover:bg-white group-hover:shadow-sm'
            }`}>
              <span className={`text-lg ${active ? '' : 'grayscale group-hover:grayscale-0'}`}>
                {item.icon}
              </span>
            </div>
            
            {/* Label */}
            <span className="text-sm">{item.name}</span>
            
            {/* Active Indicator */}
            {active && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>
            )}
          </Link>
        )
      })}

    </nav>
  )
}
