'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface FamilyMember {
  id: string
  firstName: string
  lastName: string
  profileImage?: string
  role: string
  readingPlans: Array<{
    readingPlan: {
      id: string
      title: string
      duration: number
    }
    currentDay: number
  }>
  _count: {
    prayerRequests: number
    readingPlans: number
  }
}

interface FamilyStats {
  totalMembers: number
  activePlans: number
  completedPlans: number
  totalPrayerRequests: number
}

export default function FamilyDevotion() {
  const [family, setFamily] = useState<FamilyMember[]>([])
  const [stats, setStats] = useState<FamilyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFamilyData()
  }, [])

  const loadFamilyData = async () => {
    try {
      const response = await fetch('/api/family/devotion')
      if (response.ok) {
        const data = await response.json()
        setFamily(data.family)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading family data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading family devotion data...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Family Devotion Mode</h1>
        <p className="text-gray-600">
          Track your family&apos;s spiritual growth together
        </p>
      </div>

      {/* Family Stats */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Family Members</div>
            <div className="text-3xl font-bold text-primary-600">
              {stats.totalMembers}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Active Plans</div>
            <div className="text-3xl font-bold text-primary-600">
              {stats.activePlans}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Completed Plans</div>
            <div className="text-3xl font-bold text-green-600">
              {stats.completedPlans}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Prayer Requests</div>
            <div className="text-3xl font-bold text-primary-600">
              {stats.totalPrayerRequests}
            </div>
          </div>
        </div>
      )}

      {/* Family Members Progress */}
      <div className="space-y-6">
        {family.map((member) => (
          <div key={member.id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                {member.profileImage ? (
                  <img
                    src={member.profileImage}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary-600 text-xl font-bold">
                    {member.firstName[0]}{member.lastName[0]}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">
                  {member.firstName} {member.lastName}
                </h3>
                <p className="text-sm text-gray-600 capitalize">
                  {member.role.toLowerCase()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">
                  {member._count.readingPlans}
                </div>
                <div className="text-xs text-gray-500">Plans Done</div>
              </div>
            </div>

            {/* Active Reading Plans */}
            {member.readingPlans.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Active Reading Plans
                </h4>
                <div className="space-y-2">
                  {member.readingPlans.map((rp) => (
                    <div
                      key={rp.readingPlan.id}
                      className="bg-gray-50 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">
                          {rp.readingPlan.title}
                        </span>
                        <span className="text-xs text-gray-500">
                          Day {rp.currentDay} of {rp.readingPlan.duration}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (rp.currentDay / rp.readingPlan.duration) * 100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <Link
                href={`/users/${member.id}`}
                className="text-primary-600 hover:underline text-sm"
              >
                View Full Profile →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {family.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">
            No family members found. Family relationships need to be set up.
          </p>
        </div>
      )}
    </div>
  )
}

