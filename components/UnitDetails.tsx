'use client'

import { useEffect, useMemo, useState } from 'react'

type Unit = {
  id: string
  name: string
  description?: string
  unitTypeId: string
  headUserId: string
  branchId?: string
}

type UnitMembership = {
  id: string
  userId: string
  role: 'HEAD' | 'MEMBER'
  createdAt: string
}

type UnitPayload = {
  unit: Unit
  members: UnitMembership[]
  myMembership?: UnitMembership | null
}

type UserRow = {
  id: string
  firstName?: string
  lastName?: string
  email?: string
}

type PendingInvite = {
  id: string
  invitedUserId: string
  invitedByUserId: string
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'DECLINED'
  createdAt: string
}

function parseApiError(err: any): string {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err
  if (err?.message) return String(err.message)
  return 'Request failed'
}

export default function UnitDetails({ unitId }: { unitId: string }) {
  const [payload, setPayload] = useState<UnitPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [loadingInvites, setLoadingInvites] = useState(false)

  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<UserRow[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)

  const isHead = useMemo(() => payload?.myMembership?.role === 'HEAD', [payload])

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/units/${unitId}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to load unit')
      setPayload(data)
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setLoading(false)
    }
  }

  const loadPendingInvites = async () => {
    setLoadingInvites(true)
    setError('')
    try {
      const res = await fetch(`/api/units/${unitId}/invites/pending`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        // If you're not a head, this endpoint 403s. Just hide it.
        if (res.status === 403) {
          setPendingInvites([])
          return
        }
        throw new Error(data?.error || 'Failed to load pending invites')
      }
      setPendingInvites((data.invites || []) as PendingInvite[])
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setLoadingInvites(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId])

  useEffect(() => {
    if (isHead) {
      loadPendingInvites()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId, isHead])

  const searchUsers = async () => {
    if (!userSearch.trim()) return
    setSearchingUsers(true)
    setError('')
    try {
      const q = encodeURIComponent(userSearch.trim())
      const res = await fetch(`/api/users?search=${q}&limit=10&page=1`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to search users')
      setUserResults((data.users || []) as UserRow[])
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setSearchingUsers(false)
    }
  }

  const inviteUser = async (userId: string) => {
    setError('')
    try {
      const res = await fetch(`/api/units/${unitId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to invite user')
      await load()
      await loadPendingInvites()
    } catch (e: any) {
      setError(parseApiError(e))
    }
  }

  const revokeInvite = async (inviteId: string) => {
    setError('')
    try {
      const res = await fetch(`/api/unit-invites/${inviteId}/revoke`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to revoke invite')
      await loadPendingInvites()
    } catch (e: any) {
      setError(parseApiError(e))
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading unit...</div>
      </div>
    )
  }

  if (!payload) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Unit not found.</div>
      </div>
    )
  }

  const unit = payload.unit

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <a className="text-sm text-primary-700 hover:underline" href="/groups">
          Back to Groups
        </a>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold">{unit.name}</h1>
        {unit.description && <p className="text-gray-700 mt-2">{unit.description}</p>}
        <div className="text-sm text-gray-500 mt-2">Unit ID: {unit.id}</div>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">{error}</p>
        </div>
      )}

      {isHead && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Invite Member</h2>
          <div className="flex gap-2">
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2"
              placeholder="Search by name or email"
            />
            <button
              onClick={searchUsers}
              disabled={searchingUsers || !userSearch.trim()}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 disabled:opacity-60"
            >
              {searchingUsers ? 'Searching...' : 'Search'}
            </button>
          </div>

          {userResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {userResults.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-4 border border-gray-100 rounded-lg p-3">
                  <div>
                    <div className="text-sm font-medium">
                      {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || u.id}
                    </div>
                    {u.email && <div className="text-xs text-gray-500">{u.email}</div>}
                  </div>
                  <button
                    onClick={() => inviteUser(u.id)}
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                  >
                    Invite
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isHead && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Pending Invites</h2>
          {loadingInvites ? (
            <div className="text-gray-600">Loading invites...</div>
          ) : pendingInvites.length === 0 ? (
            <div className="text-gray-600">No pending invites.</div>
          ) : (
            <div className="space-y-2">
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-4 border border-gray-100 rounded-lg p-3">
                  <div className="text-sm">
                    <div className="font-medium">{inv.invitedUserId}</div>
                    <div className="text-xs text-gray-500">Invite ID: {inv.id}</div>
                  </div>
                  <button
                    onClick={() => revokeInvite(inv.id)}
                    className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Members</h2>
        {payload.members.length === 0 ? (
          <div className="text-gray-600">No members yet.</div>
        ) : (
          <div className="space-y-2">
            {payload.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                <div className="text-sm">
                  <span className="font-medium">{m.userId}</span>
                  <span className="text-gray-500"> — {m.role}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
