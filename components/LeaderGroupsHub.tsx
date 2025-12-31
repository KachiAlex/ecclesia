'use client'

import { useEffect, useMemo, useState } from 'react'

type Unit = {
  id: string
  unitTypeId: string
  name: string
  description?: string
  headUserId: string
  branchId?: string
  permissions?: {
    invitePolicy?: 'HEAD_ONLY' | 'ANY_MEMBER'
  }
}

type UnitMembership = {
  id: string
  userId: string
  role: 'HEAD' | 'MEMBER'
  createdAt: string
  user?: {
    id: string
    firstName?: string
    lastName?: string
    email?: string
    profileImage?: string | null
  } | null
}

type UnitWithMembers = Unit & {
  members: UnitMembership[]
}

function parseApiError(err: any): string {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err
  if (err?.message) return String(err.message)
  return 'Request failed'
}

export default function LeaderGroupsHub() {
  const [units, setUnits] = useState<UnitWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUnits = async () => {
    setError('')
    setLoading(true)
    try {
      // Get units where user is HEAD
      const unitsRes = await fetch('/api/units/mine')
      if (!unitsRes.ok) {
        const errorData = await unitsRes.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to load your units (${unitsRes.status})`)
      }
      
      const unitsData = await unitsRes.json()
      const leaderUnits = (unitsData.units || []).filter((unit: Unit) => 
        unitsData.memberships?.some((m: any) => m.unitId === unit.id && m.role === 'HEAD')
      )

      // Get members for each unit
      const unitsWithMembers = await Promise.all(
        leaderUnits.map(async (unit: Unit) => {
          try {
            const membersRes = await fetch(`/api/units/${unit.id}`)
            if (membersRes.ok) {
              const memberData = await membersRes.json()
              return {
                ...unit,
                members: memberData.members || []
              }
            } else {
              console.error(`Failed to load members for unit ${unit.id}:`, membersRes.status)
              return { ...unit, members: [] }
            }
          } catch (error) {
            console.error(`Error loading members for unit ${unit.id}:`, error)
            return { ...unit, members: [] }
          }
        })
      )

      setUnits(unitsWithMembers)
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUnits()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading your groups...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Groups</h1>
          <p className="text-gray-600 mt-1">Groups where you serve as a leader.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {units.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-gray-600">
              You are not currently leading any groups. Contact your administrator if you believe this is an error.
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Your Groups ({units.length})</h2>
            <div className="space-y-3">
              {units.map((unit) => (
                <div key={unit.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold">{unit.name}</div>
                      {unit.description && (
                        <div className="text-sm text-gray-700 mt-1">{unit.description}</div>
                      )}
                      <div className="text-sm text-gray-500 mt-2">
                        {unit.members.length} member{unit.members.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Leader
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <a
                      className="text-sm text-primary-700 hover:underline"
                      href={`/groups/units/${unit.id}`}
                    >
                      Manage Group →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}