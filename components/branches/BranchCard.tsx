'use client'

import { useState } from 'react'

interface Branch {
  id: string
  name: string
  slug: string
  city?: string
  country?: string
  address?: string
  phone?: string
  email?: string
  description?: string
  adminId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface BranchCardProps {
  branch: Branch
  onDelete: () => void
  onManageAdmins: () => void
  canManage?: boolean
}

export default function BranchCard({ branch, onDelete, onManageAdmins, canManage = true }: BranchCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setDeleting(true)
    try {
      // Get churchId from user session
      const userRes = await fetch('/api/users/me')
      const userData = await userRes.json()
      
      if (!userData.churchId) {
        alert('Unable to determine church ID')
        return
      }

      const res = await fetch(`/api/churches/${userData.churchId}/branches/${branch.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        onDelete()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete branch')
      }
    } catch (error) {
      console.error('Error deleting branch:', error)
      alert('An error occurred while deleting the branch')
    } finally {
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{branch.name}</h3>
          {branch.slug && (
            <p className="text-sm text-gray-500">/{branch.slug}</p>
          )}
        </div>
        {branch.isActive ? (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            Active
          </span>
        ) : (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
            Inactive
          </span>
        )}
      </div>

      {/* Branch Details */}
      <div className="space-y-2 mb-4">
        {branch.address && (
          <div className="flex items-start text-sm text-gray-600">
            <span className="mr-2">📍</span>
            <span>{branch.address}</span>
          </div>
        )}
        {(branch.city || branch.country) && (
          <div className="flex items-start text-sm text-gray-600">
            <span className="mr-2">🌍</span>
            <span>{[branch.city, branch.country].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {branch.phone && (
          <div className="flex items-start text-sm text-gray-600">
            <span className="mr-2">📞</span>
            <span>{branch.phone}</span>
          </div>
        )}
        {branch.email && (
          <div className="flex items-start text-sm text-gray-600">
            <span className="mr-2">✉️</span>
            <span>{branch.email}</span>
          </div>
        )}
      </div>

      {branch.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{branch.description}</p>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
        {canManage ? (
          <>
            <button
              onClick={onManageAdmins}
              className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition-colors text-sm"
            >
              Manage Admins
            </button>
            {showConfirm ? (
              <>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {deleting ? 'Deleting...' : 'Confirm'}
                </button>
              </>
            ) : (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 text-sm"
              >
                Delete
              </button>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-500">No management access.</div>
        )}
      </div>
    </div>
  )
}

