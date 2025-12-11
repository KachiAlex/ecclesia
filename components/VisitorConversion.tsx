'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface VisitorConversionProps {
  userId: string
  currentRole: string
}

export default function VisitorConversion({
  userId,
  currentRole,
}: VisitorConversionProps) {
  const router = useRouter()
  const [converting, setConverting] = useState(false)
  const [newRole, setNewRole] = useState('MEMBER')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleConvert = async () => {
    if (!confirm(`Convert this user from ${currentRole} to ${newRole}?`)) {
      return
    }

    setConverting(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch(`/api/users/${userId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRole }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Conversion failed')
      }

      setSuccess(true)
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConverting(false)
    }
  }

  if (currentRole !== 'VISITOR') {
    return null // Only show for visitors
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Convert Visitor to Member</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">
          User converted successfully!
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="newRole" className="block text-sm font-medium text-gray-700 mb-2">
            Convert to:
          </label>
          <select
            id="newRole"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="MEMBER">Member</option>
            <option value="LEADER">Leader</option>
          </select>
        </div>

        <button
          onClick={handleConvert}
          disabled={converting}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {converting ? 'Converting...' : 'Convert User'}
        </button>
      </div>
    </div>
  )
}

