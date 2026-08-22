'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Group {
  id: string
  name: string
  description?: string
  type: string
  location?: string
  latitude?: number
  longitude?: number
  meetingDay?: string
  meetingTime?: string
  distance: number
  department?: {
    id: string
    name: string
  }
  _count: {
    members: number
  }
}

export default function NearbyGroups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    getLocation()
  }, [])

  const loadNearbyGroups = useCallback(async () => {
    if (!location) return

    try {
      const response = await fetch(
        `/api/groups/nearby?latitude=${location.lat}&longitude=${location.lng}&maxDistance=10`
      )
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Error loading nearby groups:', error)
    } finally {
      setLoading(false)
    }
  }, [location])

  useEffect(() => {
    if (location) {
      loadNearbyGroups()
    }
  }, [location, loadNearbyGroups])

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (err) => {
        setError('Unable to get your location. Please enable location services.')
        setLoading(false)
      }
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Finding nearby groups...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Find Nearby Groups</h1>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">{error}</p>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">
            No groups found nearby. Try increasing the search radius or check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">{group.name}</h3>
                  <p className="text-sm text-gray-600">{group.type}</p>
                  {group.department && (
                    <p className="text-sm text-primary-600">
                      {group.department.name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary-600">
                    {group.distance} km
                  </div>
                  <div className="text-xs text-gray-500">away</div>
                </div>
              </div>

              {group.description && (
                <p className="text-gray-700 mb-4">{group.description}</p>
              )}

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {group.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📍</span>
                    <span>{group.location}</span>
                  </div>
                )}
                {group.meetingDay && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📅</span>
                    <span>
                      {group.meetingDay}
                      {group.meetingTime && ` at ${group.meetingTime}`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>👥</span>
                  <span>{group._count.members} members</span>
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/groups/${group.id}/join`, {
                      method: 'POST',
                    })
                    if (response.ok) {
                      alert('Successfully joined group!')
                      loadNearbyGroups()
                    } else {
                      const errorData = await response.json()
                      alert(errorData.error || 'Failed to join group')
                    }
                  } catch (error) {
                    console.error('Error joining group:', error)
                    alert('Failed to join group')
                  }
                }}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Join Group
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

