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
  const [editingRole, setEditingRole] = useState<{ id: string; name: string; description: string } | null>(null)
  const [editingDesignation, setEditingDesignation] = useState<{
    id: string
    name: string
    description: string
    category?: string
  } | null>(null)
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null)
  const [updatingDesignationId, setUpdatingDesignationId] = useState<string | null>(null)
  const [deletingDesignationId, setDeletingDesignationId] = useState<string | null>(null)

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

  const handleEditDesignation = (designation: ChurchDesignation) => {
    if (designation.isProtected) return
    setDesignationError('')
    setEditingDesignation({
      id: designation.id,
      name: designation.name,
      description: designation.description ?? '',
      category: designation.category,
    })
  }

  const handleSaveDesignationEdit = async () => {
    if (!editingDesignation) return
    if (!editingDesignation.name.trim()) {
      setDesignationError('Designation name is required.')
      return
    }
    setUpdatingDesignationId(editingDesignation.id)
    setDesignationError('')
    try {
      const response = await fetch(`/api/designations/${editingDesignation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingDesignation.name.trim(),
          description: editingDesignation.description.trim() || undefined,
          category: editingDesignation.category || 'Worker',
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update designation')
      }
      setEditingDesignation(null)
      await loadDesignations()
    } catch (error: any) {
      setDesignationError(error?.message || 'Unable to update designation.')
    } finally {
      setUpdatingDesignationId(null)
    }
  }

  const handleDeleteDesignation = async (designation: ChurchDesignation) => {
    if (designation.isProtected) return
    const confirmed = window.confirm(`Delete the designation “${designation.name}”?`)
    if (!confirmed) return
    setDeletingDesignationId(designation.id)
    setDesignationError('')
    try {
      const response = await fetch(`/api/designations/${designation.id}`, {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to delete designation')
      }
      if (editingDesignation?.id === designation.id) {
        setEditingDesignation(null)
      }
      await loadDesignations()
    } catch (error: any) {
      setDesignationError(error?.message || 'Unable to delete designation.')
    } finally {
      setDeletingDesignationId(null)
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

  const handleEditRole = (role: ChurchRole) => {
    if (role.isProtected) return
    setRoleError('')
    setEditingRole({ id: role.id, name: role.name, description: role.description ?? '' })
  }

  const handleSaveRoleEdit = async () => {
    if (!editingRole) return
    if (!editingRole.name.trim()) {
      setRoleError('Role name is required.')
      return
    }
    setUpdatingRoleId(editingRole.id)
    setRoleError('')
    try {
      const response = await fetch(`/api/church-roles/${editingRole.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingRole.name.trim(),
          description: editingRole.description.trim() || undefined,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update role')
      }
      setEditingRole(null)
      await loadRoles()
    } catch (error: any) {
      setRoleError(error?.message || 'Unable to update role.')
    } finally {
      setUpdatingRoleId(null)
    }
  }

  const handleDeleteRole = async (role: ChurchRole) => {
    if (role.isProtected) return
    const confirmed = window.confirm(`Delete the role “${role.name}”?`)
    if (!confirmed) return
    setDeletingRoleId(role.id)
    setRoleError('')
    try {
      const response = await fetch(`/api/church-roles/${role.id}`, {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to delete role')
      }
      if (editingRole?.id === role.id) {
        setEditingRole(null)
      }
      await loadRoles()
    } catch (error: any) {
      setRoleError(error?.message || 'Unable to delete role.')
    } finally {
      setDeletingRoleId(null)
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
            roles.map((role) => {
              const isEditing = editingRole?.id === role.id
              const isBusy = updatingRoleId === role.id || deletingRoleId === role.id
              return (
                <div
                  key={role.id}
                  className="border border-gray-200 rounded-xl px-4 py-3 flex flex-col gap-3 bg-white"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingRole.name}
                        onChange={(event) =>
                          setEditingRole((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={editingRole.description}
                        onChange={(event) =>
                          setEditingRole((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Description (optional)"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingRole(null)}
                          className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                          disabled={isBusy}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveRoleEdit}
                          disabled={isBusy}
                          className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                        >
                          {updatingRoleId === role.id ? 'Saving…' : 'Save changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-gray-900">{role.name}</div>
                        {role.description && <div className="text-sm text-gray-500">{role.description}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        {role.isProtected ? (
                          <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Default</span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                              onClick={() => handleEditRole(role)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-sm text-red-600 hover:text-red-700 font-medium"
                              onClick={() => handleDeleteRole(role)}
                              disabled={isBusy}
                            >
                              {deletingRoleId === role.id ? 'Deleting…' : 'Delete'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
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
            designations.map((designation) => {
              const isEditing = editingDesignation?.id === designation.id
              const isBusy =
                updatingDesignationId === designation.id || deletingDesignationId === designation.id
              return (
                <div
                  key={designation.id}
                  className="border border-gray-200 rounded-xl px-4 py-3 flex flex-col gap-3 bg-white"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingDesignation.name}
                        onChange={(event) =>
                          setEditingDesignation((prev) =>
                            prev ? { ...prev, name: event.target.value } : prev,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={editingDesignation.description}
                        onChange={(event) =>
                          setEditingDesignation((prev) =>
                            prev ? { ...prev, description: event.target.value } : prev,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Description (optional)"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingDesignation(null)}
                          className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                          disabled={isBusy}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDesignationEdit}
                          disabled={isBusy}
                          className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                        >
                          {updatingDesignationId === designation.id ? 'Saving…' : 'Save changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-gray-900">{designation.name}</div>
                        {designation.description && (
                          <div className="text-sm text-gray-500">{designation.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {designation.isProtected ? (
                          <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Default</span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                              onClick={() => handleEditDesignation(designation)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-sm text-red-600 hover:text-red-700 font-medium"
                              onClick={() => handleDeleteDesignation(designation)}
                              disabled={isBusy}
                            >
                              {deletingDesignationId === designation.id ? 'Deleting…' : 'Delete'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
