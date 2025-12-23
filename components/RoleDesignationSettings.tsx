'use client'

import { useEffect, useState } from 'react'

type ChurchRole = {
  id: string
  name: string
  description?: string
  isDefault?: boolean
  isProtected?: boolean
}

type ChurchDesignation = {
  id: string
  name: string
  description?: string
  category?: string
  isDefault?: boolean
  isProtected?: boolean
}

export default function RoleDesignationSettings() {
  const [roles, setRoles] = useState<ChurchRole[]>([])
  const [designations, setDesignations] = useState<ChurchDesignation[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [loadingDesignations, setLoadingDesignations] = useState(true)
  const [roleForm, setRoleForm] = useState({ name: '', description: '' })
  const [designationForm, setDesignationForm] = useState({ name: '', description: '' })
  const [roleError, setRoleError] = useState('')
  const [designationError, setDesignationError] = useState('')
  const [savingRole, setSavingRole] = useState(false)
  const [savingDesignation, setSavingDesignation] = useState(false)

  const loadRoles = async () => {
    setLoadingRoles(true)
    try {
      const response = await fetch('/api/church-roles')
      if (!response.ok) throw new Error('Failed to load roles')
      const data = await response.json()
      setRoles(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      setRoles([])
    } finally {
      setLoadingRoles(false)
    }
  }

  const loadDesignations = async () => {
    setLoadingDesignations(true)
    try {
      const response = await fetch('/api/designations')
      if (!response.ok) throw new Error('Failed to load designations')
      const data = await response.json()
      setDesignations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      setDesignations([])
    } finally {
      setLoadingDesignations(false)
    }
  }

  useEffect(() => {
    loadRoles()
    loadDesignations()
  }, [])

  const handleCreateRole = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!roleForm.name.trim()) {
      setRoleError('Role name is required.')
      return
    }
    setSavingRole(true)
    setRoleError('')
    try {
      const response = await fetch('/api/church-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleForm.name.trim(),
          description: roleForm.description.trim() || undefined,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create role')
      }
      setRoleForm({ name: '', description: '' })
      await loadRoles()
    } catch (error: any) {
      setRoleError(error?.message || 'Unable to create role.')
    } finally {
      setSavingRole(false)
    }
  }

  const handleCreateDesignation = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!designationForm.name.trim()) {
      setDesignationError('Designation name is required.')
      return
    }
    setSavingDesignation(true)
    setDesignationError('')
    try {
      const response = await fetch('/api/designations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: designationForm.name.trim(),
          description: designationForm.description.trim() || undefined,
          category: 'Worker',
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create designation')
      }
      setDesignationForm({ name: '', description: '' })
      await loadDesignations()
    } catch (error: any) {
      setDesignationError(error?.message || 'Unable to create designation.')
    } finally {
      setSavingDesignation(false)
    }
  }

  return (
    <div className="space-y-12">
      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Church roles</p>
            <h2 className="text-xl font-semibold text-gray-900 mt-1">Manage worker roles</h2>
            <p className="text-sm text-gray-500 mt-1">
              Admin & Worker roles are provided by default. Add additional roles like Leaders or Coordinators based on
              your church structure.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateRole} className="bg-gray-50 rounded-xl p-4 space-y-4 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Role name
              <input
                type="text"
                value={roleForm.name}
                onChange={(event) => setRoleForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Leaders, Coordinators"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </label>
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Description <span className="text-gray-400">(optional)</span>
              <input
                type="text"
                value={roleForm.description}
                onChange={(event) => setRoleForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Describe what this role represents"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </label>
          </div>
          {roleError && <p className="text-sm text-red-600">{roleError}</p>}
          <div className="text-right">
            <button
              type="submit"
              disabled={savingRole}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {savingRole ? 'Saving…' : 'Add role'}
            </button>
          </div>
        </form>

        <div className="grid gap-3">
          {loadingRoles ? (
            <div className="text-sm text-gray-500">Loading roles…</div>
          ) : roles.length === 0 ? (
            <div className="text-sm text-gray-500">No roles configured yet.</div>
          ) : (
            roles.map((role) => (
              <div
                key={role.id}
                className="border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between bg-white"
              >
                <div>
                  <div className="font-semibold text-gray-900">{role.name}</div>
                  {role.description && <div className="text-sm text-gray-500">{role.description}</div>}
                </div>
                {role.isProtected && (
                  <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Default</span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Designations</p>
            <h2 className="text-xl font-semibold text-gray-900 mt-1">Create ministry designations</h2>
            <p className="text-sm text-gray-500 mt-1">
              Define titles like Minister, Deacon, Resident Pastor, Evangelism Secretary, and more to match your culture.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateDesignation} className="bg-gray-50 rounded-xl p-4 space-y-4 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Designation name
              <input
                type="text"
                value={designationForm.name}
                onChange={(event) => setDesignationForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Resident Pastor, Chaplain"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </label>
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Description <span className="text-gray-400">(optional)</span>
              <input
                type="text"
                value={designationForm.description}
                onChange={(event) => setDesignationForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Add context for this title"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </label>
          </div>
          {designationError && <p className="text-sm text-red-600">{designationError}</p>}
          <div className="text-right">
            <button
              type="submit"
              disabled={savingDesignation}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {savingDesignation ? 'Saving…' : 'Add designation'}
            </button>
          </div>
        </form>

        <div className="grid gap-3">
          {loadingDesignations ? (
            <div className="text-sm text-gray-500">Loading designations…</div>
          ) : designations.length === 0 ? (
            <div className="text-sm text-gray-500">No designations configured yet.</div>
          ) : (
            designations.map((designation) => (
              <div
                key={designation.id}
                className="border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between bg-white"
              >
                <div>
                  <div className="font-semibold text-gray-900">{designation.name}</div>
                  {designation.description && <div className="text-sm text-gray-500">{designation.description}</div>}
                </div>
                {designation.isProtected && (
                  <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Default</span>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
