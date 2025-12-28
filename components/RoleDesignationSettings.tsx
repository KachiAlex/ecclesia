'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

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

type StaffLevel = {
  id: string
  name: string
  description?: string
  defaultWageAmount: number
  currency: string
  payFrequency: 'weekly' | 'biweekly' | 'monthly' | 'annual'
  isDefault?: boolean
  order?: number
}

const DEFAULT_PAY_FREQUENCIES: StaffLevel['payFrequency'][] = ['weekly', 'biweekly', 'monthly', 'annual']

export default function RoleDesignationSettings() {
  const [roles, setRoles] = useState<ChurchRole[]>([])
  const [designations, setDesignations] = useState<ChurchDesignation[]>([])
  const [staffLevels, setStaffLevels] = useState<StaffLevel[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [loadingDesignations, setLoadingDesignations] = useState(true)
  const [loadingStaffLevels, setLoadingStaffLevels] = useState(true)
  const [roleForm, setRoleForm] = useState({ name: '', description: '' })
  const [designationForm, setDesignationForm] = useState({ name: '', description: '' })
  const [staffLevelForm, setStaffLevelForm] = useState({
    name: '',
    description: '',
    defaultWageAmount: '',
    currency: 'NGN',
    payFrequency: 'monthly',
  })
  const [roleError, setRoleError] = useState('')
  const [designationError, setDesignationError] = useState('')
  const [staffLevelError, setStaffLevelError] = useState('')
  const [savingRole, setSavingRole] = useState(false)
  const [savingDesignation, setSavingDesignation] = useState(false)
  const [savingStaffLevel, setSavingStaffLevel] = useState(false)
  const [editingRole, setEditingRole] = useState<{ id: string; name: string; description: string } | null>(null)
  const [editingDesignation, setEditingDesignation] = useState<{
    id: string
    name: string
    description: string
    category?: string
  } | null>(null)
  const [editingStaffLevel, setEditingStaffLevel] = useState<{
    id: string
    name: string
    description: string
    defaultWageAmount: string
    currency: string
    payFrequency: StaffLevel['payFrequency']
  } | null>(null)
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null)
  const [updatingDesignationId, setUpdatingDesignationId] = useState<string | null>(null)
  const [deletingDesignationId, setDeletingDesignationId] = useState<string | null>(null)
  const [updatingStaffLevelId, setUpdatingStaffLevelId] = useState<string | null>(null)
  const [deletingStaffLevelId, setDeletingStaffLevelId] = useState<string | null>(null)

  const loadRoles = useCallback(async () => {
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
  }, [])

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

  const loadDesignations = useCallback(async () => {
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
  }, [])

  const loadStaffLevels = useCallback(async () => {
    setLoadingStaffLevels(true)
    try {
      const response = await fetch('/api/staff-levels')
      if (!response.ok) throw new Error('Failed to load staff levels')
      const data = await response.json()
      setStaffLevels(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      setStaffLevels([])
    } finally {
      setLoadingStaffLevels(false)
    }
  }, [])

  useEffect(() => {
    loadRoles()
    loadDesignations()
    loadStaffLevels()
  }, [loadRoles, loadDesignations, loadStaffLevels])

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

  const handleCreateStaffLevel = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!staffLevelForm.name.trim()) {
      setStaffLevelError('Staff level name is required.')
      return
    }
    const amount = Number(staffLevelForm.defaultWageAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setStaffLevelError('Enter a valid wage greater than 0.')
      return
    }
    if (!/^[A-Za-z]{3}$/.test(staffLevelForm.currency.trim())) {
      setStaffLevelError('Currency must be a 3-letter code, e.g. USD, NGN.')
      return
    }
    setSavingStaffLevel(true)
    setStaffLevelError('')
    try {
      const response = await fetch('/api/staff-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffLevelForm.name.trim(),
          description: staffLevelForm.description.trim() || undefined,
          defaultWageAmount: amount,
          currency: staffLevelForm.currency.trim().toUpperCase(),
          payFrequency: staffLevelForm.payFrequency,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create staff level')
      }
      setStaffLevelForm({
        name: '',
        description: '',
        defaultWageAmount: '',
        currency: staffLevelForm.currency,
        payFrequency: staffLevelForm.payFrequency,
      })
      await loadStaffLevels()
    } catch (error: any) {
      setStaffLevelError(error?.message || 'Unable to create staff level.')
    } finally {
      setSavingStaffLevel(false)
    }
  }

  const startEditingStaffLevel = (level: StaffLevel) => {
    setStaffLevelError('')
    setEditingStaffLevel({
      id: level.id,
      name: level.name,
      description: level.description ?? '',
      defaultWageAmount: String(level.defaultWageAmount ?? ''),
      currency: level.currency || 'NGN',
      payFrequency: level.payFrequency ?? 'monthly',
    })
  }

  const handleSaveStaffLevelEdit = useCallback(async () => {
    if (!editingStaffLevel) return
    if (!editingStaffLevel.name.trim()) {
      setStaffLevelError('Staff level name is required.')
      return
    }
    const amount = Number(editingStaffLevel.defaultWageAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setStaffLevelError('Enter a valid wage greater than 0.')
      return
    }
    if (!/^[A-Za-z]{3}$/.test(editingStaffLevel.currency.trim())) {
      setStaffLevelError('Currency must be a 3-letter code, e.g. USD, NGN.')
      return
    }
    setUpdatingStaffLevelId(editingStaffLevel.id)
    setStaffLevelError('')
    try {
      const response = await fetch(`/api/staff-levels/${editingStaffLevel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingStaffLevel.name.trim(),
          description: editingStaffLevel.description.trim() || undefined,
          defaultWageAmount: amount,
          currency: editingStaffLevel.currency.trim().toUpperCase(),
          payFrequency: editingStaffLevel.payFrequency,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update staff level')
      }
      setEditingStaffLevel(null)
      await loadStaffLevels()
    } catch (error: any) {
      setStaffLevelError(error?.message || 'Unable to update staff level.')
    } finally {
      setUpdatingStaffLevelId(null)
    }
  }, [editingStaffLevel, loadStaffLevels])

  const handleDeleteStaffLevel = useCallback(async (level: StaffLevel) => {
    const confirmed = window.confirm(`Delete the staff level “${level.name}”?`)
    if (!confirmed) return
    setDeletingStaffLevelId(level.id)
    setStaffLevelError('')
    try {
      const response = await fetch(`/api/staff-levels/${level.id}`, {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to delete staff level')
      }
      if (editingStaffLevel?.id === level.id) {
        setEditingStaffLevel(null)
      }
      await loadStaffLevels()
    } catch (error: any) {
      setStaffLevelError(error?.message || 'Unable to delete staff level.')
    } finally {
      setDeletingStaffLevelId(null)
    }
  }, [editingStaffLevel, loadStaffLevels])

  const staffLevelCards = useMemo(() => {
    if (loadingStaffLevels) {
      return <div className="text-sm text-gray-500">Loading staff levels…</div>
    }
    if (staffLevels.length === 0) {
      return <div className="text-sm text-gray-500">No staff levels yet. Create your first one.</div>
    }

    return staffLevels.map((level) => {
      const isEditing = editingStaffLevel?.id === level.id
      const isBusy = updatingStaffLevelId === level.id || deletingStaffLevelId === level.id
      return (
        <div
          key={level.id}
          className="border border-gray-200 rounded-xl px-4 py-3 flex flex-col gap-3 bg-gradient-to-br from-white to-gray-50"
        >
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editingStaffLevel.name}
                onChange={(event) =>
                  setEditingStaffLevel((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Staff level name"
              />
              <textarea
                value={editingStaffLevel.description}
                onChange={(event) =>
                  setEditingStaffLevel((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Description (optional)"
                rows={2}
              />
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-sm text-gray-600 flex flex-col gap-1">
                  Default wage
                  <input
                    type="number"
                    min="0"
                    value={editingStaffLevel.defaultWageAmount}
                    onChange={(event) =>
                      setEditingStaffLevel((prev) =>
                        prev ? { ...prev, defaultWageAmount: event.target.value } : prev,
                      )
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </label>
                <label className="text-sm text-gray-600 flex flex-col gap-1">
                  Currency
                  <input
                    type="text"
                    maxLength={3}
                    value={editingStaffLevel.currency}
                    onChange={(event) =>
                      setEditingStaffLevel((prev) =>
                        prev ? { ...prev, currency: event.target.value.toUpperCase() } : prev,
                      )
                    }
                    className="px-3 py-2 uppercase border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </label>
                <label className="text-sm text-gray-600 flex flex-col gap-1">
                  Pay frequency
                  <select
                    value={editingStaffLevel.payFrequency}
                    onChange={(event) =>
                      setEditingStaffLevel((prev) =>
                        prev ? { ...prev, payFrequency: event.target.value as StaffLevel['payFrequency'] } : prev,
                      )
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {DEFAULT_PAY_FREQUENCIES.map((frequency) => (
                      <option key={frequency} value={frequency}>
                        {frequency === 'biweekly' ? 'Bi-weekly' : frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaffLevel(null)}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={isBusy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveStaffLevelEdit}
                  disabled={isBusy}
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {updatingStaffLevelId === level.id ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{level.name}</div>
                  {level.description && <p className="text-sm text-gray-500">{level.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    onClick={() => startEditingStaffLevel(level)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                    onClick={() => handleDeleteStaffLevel(level)}
                    disabled={isBusy}
                  >
                    {deletingStaffLevelId === level.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
              <div className="grid gap-2 text-sm text-gray-600 md:grid-cols-3">
                <div className="rounded-lg bg-white border border-gray-200 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Default wage</p>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {level.currency} {new Intl.NumberFormat().format(level.defaultWageAmount ?? 0)}
                  </p>
                </div>
                <div className="rounded-lg bg-white border border-gray-200 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Pay schedule</p>
                  <p className="text-base font-semibold text-gray-900 mt-1 capitalize">
                    {level.payFrequency === 'biweekly' ? 'Bi-weekly' : level.payFrequency}
                  </p>
                </div>
                <div className="rounded-lg bg-white border border-gray-200 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Visibility</p>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {level.isDefault ? 'Default for staff' : 'Custom'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    })
  }, [
    deletingStaffLevelId,
    editingStaffLevel,
    loadingStaffLevels,
    staffLevels,
    updatingStaffLevelId,
    handleDeleteStaffLevel,
    handleSaveStaffLevelEdit,
  ])

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

      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Staff levels</p>
            <h2 className="text-xl font-semibold text-gray-900 mt-1">Define wage tiers</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure wage expectations per tier so payroll and staff onboarding stay synchronized. You can override
              wages per person later.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateStaffLevel} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 space-y-4 mb-6 border border-dashed border-gray-200">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Staff level name
              <input
                type="text"
                value={staffLevelForm.name}
                onChange={(event) => setStaffLevelForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Junior Staff, Supervising Pastor"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </label>
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Description <span className="text-gray-400">(optional)</span>
              <input
                type="text"
                value={staffLevelForm.description}
                onChange={(event) => setStaffLevelForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Optional context for this level"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Default wage amount
              <input
                type="number"
                min="0"
                value={staffLevelForm.defaultWageAmount}
                onChange={(event) => setStaffLevelForm((prev) => ({ ...prev, defaultWageAmount: event.target.value }))}
                placeholder="0.00"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </label>
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Currency
              <input
                type="text"
                maxLength={3}
                value={staffLevelForm.currency}
                onChange={(event) =>
                  setStaffLevelForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))
                }
                className="px-3 py-2 uppercase border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </label>
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Pay frequency
              <select
                value={staffLevelForm.payFrequency}
                onChange={(event) =>
                  setStaffLevelForm((prev) => ({
                    ...prev,
                    payFrequency: event.target.value as StaffLevel['payFrequency'],
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {DEFAULT_PAY_FREQUENCIES.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {frequency === 'biweekly' ? 'Bi-weekly' : frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {staffLevelError && <p className="text-sm text-red-600">{staffLevelError}</p>}
          <div className="text-right">
            <button
              type="submit"
              disabled={savingStaffLevel}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {savingStaffLevel ? 'Saving…' : 'Add staff level'}
            </button>
          </div>
        </form>

        <div className="grid gap-3">{staffLevelCards}</div>
      </section>
    </div>
  )
}
