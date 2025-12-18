'use client'

import { useEffect, useMemo, useState } from 'react'

type UnitTypeJoinPolicy = 'INVITE_ONLY' | 'OPEN' | 'REQUEST'
type UnitTypeCreationPolicy = 'ADMIN_ONLY' | 'ANYONE'

type UnitType = {
  id: string
  name: string
  description?: string
  allowMultiplePerUser: boolean
  joinPolicy: UnitTypeJoinPolicy
  creationPolicy: UnitTypeCreationPolicy
}

type Unit = {
  id: string
  unitTypeId: string
  name: string
  description?: string
  headUserId: string
  branchId?: string
}

type Invite = {
  id: string
  unitId: string
  unitTypeId: string
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

export default function GroupsHub() {
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [invites, setInvites] = useState<Invite[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState<'units' | 'invites' | 'admin'>('units')

  // Admin: create unit type form
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeDescription, setNewTypeDescription] = useState('')
  const [newTypeAllowMultiple, setNewTypeAllowMultiple] = useState(false)
  const [newTypeJoinPolicy, setNewTypeJoinPolicy] = useState<UnitTypeJoinPolicy>('INVITE_ONLY')
  const [newTypeCreationPolicy, setNewTypeCreationPolicy] = useState<UnitTypeCreationPolicy>('ADMIN_ONLY')
  const [savingType, setSavingType] = useState(false)

  // Create unit form
  const [createUnitTypeId, setCreateUnitTypeId] = useState('')
  const [newUnitName, setNewUnitName] = useState('')
  const [newUnitDescription, setNewUnitDescription] = useState('')
  const [savingUnit, setSavingUnit] = useState(false)

  const unitTypeById = useMemo(() => {
    const map: Record<string, UnitType> = {}
    unitTypes.forEach((t) => (map[t.id] = t))
    return map
  }, [unitTypes])

  const loadAll = async () => {
    setError('')
    setLoading(true)
    try {
      const [typesRes, unitsRes, invitesRes] = await Promise.all([
        fetch('/api/unit-types'),
        fetch('/api/units'),
        fetch('/api/unit-invites'),
      ])

      if (!typesRes.ok) throw new Error((await typesRes.json())?.error || 'Failed to load unit types')
      if (!unitsRes.ok) throw new Error((await unitsRes.json())?.error || 'Failed to load units')
      if (!invitesRes.ok) throw new Error((await invitesRes.json())?.error || 'Failed to load invites')

      const typesJson = await typesRes.json()
      const unitsJson = await unitsRes.json()
      const invitesJson = await invitesRes.json()

      setUnitTypes(typesJson.unitTypes || [])
      setUnits(unitsJson.units || [])
      setInvites(invitesJson.invites || [])

      if (!createUnitTypeId && (typesJson.unitTypes || []).length > 0) {
        setCreateUnitTypeId((typesJson.unitTypes || [])[0].id)
      }
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createUnitType = async () => {
    setSavingType(true)
    setError('')
    try {
      const res = await fetch('/api/unit-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTypeName,
          description: newTypeDescription || undefined,
          allowMultiplePerUser: newTypeAllowMultiple,
          joinPolicy: newTypeJoinPolicy,
          creationPolicy: newTypeCreationPolicy,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to create unit type')

      setNewTypeName('')
      setNewTypeDescription('')
      setNewTypeAllowMultiple(false)
      setNewTypeJoinPolicy('INVITE_ONLY')
      setNewTypeCreationPolicy('ADMIN_ONLY')

      await loadAll()
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setSavingType(false)
    }
  }

  const createUnit = async () => {
    setSavingUnit(true)
    setError('')
    try {
      const res = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitTypeId: createUnitTypeId,
          name: newUnitName,
          description: newUnitDescription || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to create unit')

      setNewUnitName('')
      setNewUnitDescription('')
      await loadAll()
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setSavingUnit(false)
    }
  }

  const acceptInvite = async (inviteId: string) => {
    setError('')
    try {
      const res = await fetch(`/api/unit-invites/${inviteId}/accept`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to accept invite')
      await loadAll()
    } catch (e: any) {
      setError(parseApiError(e))
    }
  }

  const declineInvite = async (inviteId: string) => {
    setError('')
    try {
      const res = await fetch(`/api/unit-invites/${inviteId}/decline`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to decline invite')
      await loadAll()
    } catch (e: any) {
      setError(parseApiError(e))
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading groups...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Groups</h1>
          <p className="text-gray-600 mt-1">Units (cells, departments, family units) managed by your church.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/groups/nearby"
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm"
          >
            Find Nearby Groups
          </a>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">{error}</p>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('units')}
          className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'units' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Units
        </button>
        <button
          onClick={() => setActiveTab('invites')}
          className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'invites' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Invites
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'admin' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Admin
        </button>
      </div>

      {activeTab === 'units' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Create Unit</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
                <select
                  value={createUnitTypeId}
                  onChange={(e) => setCreateUnitTypeId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                >
                  {unitTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  placeholder="e.g. Cell Group A"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                value={newUnitDescription}
                onChange={(e) => setNewUnitDescription(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2"
                placeholder="Optional"
              />
            </div>
            <div className="mt-4">
              <button
                disabled={savingUnit || !createUnitTypeId || !newUnitName.trim()}
                onClick={createUnit}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
              >
                {savingUnit ? 'Creating...' : 'Create Unit'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Units</h2>
            {units.length === 0 ? (
              <div className="text-gray-600">No units yet.</div>
            ) : (
              <div className="space-y-3">
                {units.map((u) => (
                  <div key={u.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-sm text-gray-600">{unitTypeById[u.unitTypeId]?.name || 'Unit'}</div>
                        {u.description && <div className="text-sm text-gray-700 mt-1">{u.description}</div>}
                      </div>
                    </div>
                    <div className="mt-3">
                      <a
                        className="text-sm text-primary-700 hover:underline"
                        href={`/groups/units/${u.id}`}
                      >
                        Manage / View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'invites' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Pending Invites</h2>
          {invites.length === 0 ? (
            <div className="text-gray-600">No pending invites.</div>
          ) : (
            <div className="space-y-3">
              {invites.map((inv) => (
                <div key={inv.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="text-sm text-gray-700">
                    You were invited to join a unit.
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Invite ID: {inv.id}</div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => acceptInvite(inv.id)}
                      className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => declineInvite(inv.id)}
                      className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Create Unit Type (Admins)</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  placeholder="e.g. Cell, Department, Family Unit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Join Policy</label>
                <select
                  value={newTypeJoinPolicy}
                  onChange={(e) => setNewTypeJoinPolicy(e.target.value as UnitTypeJoinPolicy)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                >
                  <option value="INVITE_ONLY">Invite Only</option>
                  <option value="OPEN">Open</option>
                  <option value="REQUEST">Request</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                value={newTypeDescription}
                onChange={(e) => setNewTypeDescription(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2"
                placeholder="Optional"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Creation Policy</label>
                <select
                  value={newTypeCreationPolicy}
                  onChange={(e) => setNewTypeCreationPolicy(e.target.value as UnitTypeCreationPolicy)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                >
                  <option value="ADMIN_ONLY">Admins only</option>
                  <option value="ANYONE">Anyone</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  id="allow-multi"
                  type="checkbox"
                  checked={newTypeAllowMultiple}
                  onChange={(e) => setNewTypeAllowMultiple(e.target.checked)}
                />
                <label htmlFor="allow-multi" className="text-sm text-gray-700">
                  Allow multiple memberships per user
                </label>
              </div>
            </div>

            <div className="mt-4">
              <button
                disabled={savingType || !newTypeName.trim()}
                onClick={createUnitType}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
              >
                {savingType ? 'Creating...' : 'Create Unit Type'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Unit Types</h2>
            {unitTypes.length === 0 ? (
              <div className="text-gray-600">No unit types yet.</div>
            ) : (
              <div className="space-y-3">
                {unitTypes.map((t) => (
                  <div key={t.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="font-semibold">{t.name}</div>
                    {t.description && <div className="text-sm text-gray-700 mt-1">{t.description}</div>}
                    <div className="text-xs text-gray-500 mt-2">
                      allowMultiplePerUser: {String(t.allowMultiplePerUser)} | joinPolicy: {t.joinPolicy} | creationPolicy: {t.creationPolicy}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
