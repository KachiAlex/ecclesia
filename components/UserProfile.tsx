'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import VisitorConversion from './VisitorConversion'

type PayFrequencyOption = 'weekly' | 'biweekly' | 'monthly' | 'annual'

interface UserProfileProps {
  userId: string
}

const formatCurrency = (amount?: number | null, currency?: string | null) => {
  if (typeof amount !== 'number' || !currency) return null
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

const formatPayFrequencyLabel = (frequency?: PayFrequencyOption | string | null) => {
  if (!frequency) return null
  const normalized = frequency.toLowerCase()
  return normalized === 'biweekly'
    ? 'Bi-weekly'
    : normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  spiritualMaturity?: string
  profileImage?: string
  bio?: string
  dateOfBirth?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  xp: number
  level: number
  createdAt: string
  lastLoginAt?: string
  salary?: {
    position: {
      name: string
      department?: {
        name: string
      }
    }
    wageScale: {
      type: string
      amount: number
      currency: string
    }
  }
  isStaff?: boolean
  staffLevelId?: string
  staffLevelName?: string
  customWage?: {
    amount: number
    currency: string
    payFrequency: PayFrequencyOption
  } | null
  _count: {
    departments: number
    groups: number
    badges: number
    prayerRequests: number
    sermonsWatched: number
    giving: number
    eventsAttended: number
  }
}

export default function UserProfile({ userId }: UserProfileProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUser = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (!response.ok) {
        throw new Error('Failed to load user')
      }
      const data = await response.json()
      setUser(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading profile...</div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'User not found'}</p>
        </div>
      </div>
    )
  }

  const formattedCustomWage = user.customWage
    ? formatCurrency(user.customWage.amount, user.customWage.currency) ??
      `${user.customWage.currency} ${user.customWage.amount.toLocaleString()}`
    : null
  const customWageFrequency = user.customWage
    ? formatPayFrequencyLabel(user.customWage.payFrequency)
    : null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/users"
          className="text-primary-600 hover:underline"
        >
          ← Back to Directory
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-8 text-white">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-3xl text-primary-600 font-bold">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-primary-100">{user.email}</p>
              {user.phone && <p className="text-primary-100">{user.phone}</p>}
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1">
                    <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm">
                      {user.role}
                    </span>
                  </dd>
                </div>
                {typeof user.isStaff === 'boolean' && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Staff Status</dt>
                    <dd className="mt-1">
                      {user.isStaff ? (
                        <div className="space-y-2">
                          <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-semibold">
                            Staff
                            {user.staffLevelName && (
                              <span className="text-primary-500 text-xs font-medium">
                                · {user.staffLevelName}
                              </span>
                            )}
                          </span>
                          {formattedCustomWage ? (
                            <p className="text-xs text-gray-600">
                              Custom wage: {formattedCustomWage}
                              {customWageFrequency && <> · {customWageFrequency}</>}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500">
                              Uses wage defined by the assigned staff level.
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                          Non-staff
                        </span>
                      )}
                    </dd>
                  </div>
                )}
                {user.spiritualMaturity && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Spiritual Maturity
                    </dt>
                    <dd className="mt-1 text-gray-900">
                      {user.spiritualMaturity.replace('_', ' ')}
                    </dd>
                  </div>
                )}
                {user.dateOfBirth && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Date of Birth
                    </dt>
                    <dd className="mt-1 text-gray-900">
                      {formatDate(user.dateOfBirth)}
                    </dd>
                  </div>
                )}
                {user.address && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-gray-900">
                      {user.address}
                      {user.city && `, ${user.city}`}
                      {user.state && `, ${user.state}`}
                      {user.zipCode && ` ${user.zipCode}`}
                      {user.country && `, ${user.country}`}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Member Since
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {formatDate(user.createdAt)}
                  </dd>
                </div>
                {user.lastLoginAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Last Login
                    </dt>
                    <dd className="mt-1 text-gray-900">
                      {formatDate(user.lastLoginAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Engagement Stats */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Engagement</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary-600">
                    {user._count.departments}
                  </div>
                  <div className="text-sm text-gray-600">Departments</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary-600">
                    {user._count.groups}
                  </div>
                  <div className="text-sm text-gray-600">Groups</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary-600">
                    {user._count.badges}
                  </div>
                  <div className="text-sm text-gray-600">Badges</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary-600">
                    {user._count.sermonsWatched}
                  </div>
                  <div className="text-sm text-gray-600">Sermons</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary-600">
                    {user._count.giving}
                  </div>
                  <div className="text-sm text-gray-600">Giving</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary-600">
                    {user._count.eventsAttended}
                  </div>
                  <div className="text-sm text-gray-600">Events</div>
                </div>
              </div>

              {/* Gamification */}
              <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Level</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {user.level}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">XP</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {user.xp.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Bio</h2>
              <p className="text-gray-700">{user.bio}</p>
            </div>
          )}

          {/* Salary Information */}
          {user.salary && (
            <div className="mt-8 border-t pt-8">
              <h2 className="text-xl font-semibold mb-4">Position & Salary</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Position</div>
                    <div className="font-medium">{user.salary.position.name}</div>
                    {user.salary.position.department && (
                      <div className="text-sm text-gray-500">
                        {user.salary.position.department.name}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Type</div>
                    <div className="font-medium">
                      {user.salary.wageScale.type.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Amount</div>
                    <div className="font-medium">
                      {user.salary.wageScale.currency}{' '}
                      {user.salary.wageScale.amount.toLocaleString()}
                      {user.salary.wageScale.type === 'HOURLY' && '/hour'}
                      {user.salary.wageScale.type === 'SALARY' && '/month'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Visitor Conversion */}
          {user.role === 'VISITOR' && (
            <div className="mt-8">
              <VisitorConversion userId={user.id} currentRole={user.role} />
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <Link
              href={`/users/${userId}/edit`}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

