'use client'

import { useCallback, useEffect, useState } from 'react'

interface BranchAdmin {
  id: string
  branchId: string
  userId: string
  canManageMembers: boolean
  canManageEvents: boolean
  canManageGroups: boolean
  canManageGiving: boolean
  canManageSermons: boolean
  assignedAt: string
  assignedBy?: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
}

interface BranchAdminModalProps {
  churchId: string
  branchId: string
  branchName: string
  onClose: () => void
}

export default function BranchAdminModal({ churchId, branchId, branchName, onClose }: BranchAdminModalProps) {
  const [admins, setAdmins] = useState<BranchAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch(`/api/churches/${churchId}/branches/${branchId}/admins`)
      if (res.ok) {
        const data = await res.json()
        setAdmins(data)
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
    } finally {
      setLoading(false)
    }
  }, [branchId, churchId])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/users?churchId=${churchId}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.filter((u: any) => u.id && u.role !== 'SUPER_ADMIN'))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }, [churchId])

  useEffect(() => {
    fetchAdmins()
    fetchUsers()
  }, [fetchAdmins, fetchUsers])

  const handleAddAdmin = async () => {
    if (!selectedUserId) {
      setError('Please select a user')
      return
    }

    setAdding(true)
    setError('')

    try {
      const res = await fetch(`/api/churches/${churchId}/branches/${branchId}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          canManageMembers: true,
          canManageEvents: true,
          canManageGroups: true,
          canManageGiving: false,
          canManageSermons: false,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add admin')
      }

      setShowAddForm(false)
      setSelectedUserId('')
      fetchAdmins()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveAdmin = async (adminId: string, userId: string) => {
    if (!confirm('Are you sure you want to remove this admin from the branch?')) return

    try {
      const res = await fetch(`/api/churches/${churchId}/branches/${branchId}/admins`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (res.ok) {
        fetchAdmins()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to remove admin')
      }
    } catch (error) {
      console.error('Error removing admin:', error)
      alert('An error occurred')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Branch Admins</h2>
            <p className="text-sm text-gray-600 mt-1">{branchName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
              {error}
            </div>
          )}

          {/* Add Admin Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              + Add Admin
            </button>
          )}

          {/* Add Admin Form */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Add Branch Admin</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select User
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="">Choose a user...</option>
                    {users
                      .filter((u) => !admins.some((a) => a.userId === u.id))
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleAddAdmin}
                    disabled={adding || !selectedUserId}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {adding ? 'Adding...' : 'Add Admin'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setSelectedUserId('')
                      setError('')
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Admins List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No admins assigned to this branch yet.
            </div>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="flex-1">
                    {admin.user ? (
                      <>
                        <h4 className="font-semibold text-gray-900">
                          {admin.user.firstName} {admin.user.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{admin.user.email}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {admin.canManageMembers && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Members</span>
                          )}
                          {admin.canManageEvents && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Events</span>
                          )}
                          {admin.canManageGroups && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Groups</span>
                          )}
                          {admin.canManageGiving && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Giving</span>
                          )}
                          {admin.canManageSermons && (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">Sermons</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-600">Loading user info...</p>
                    )}
                  </div>
                  <button
                    onClick={() => admin.user && handleRemoveAdmin(admin.id, admin.userId)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

