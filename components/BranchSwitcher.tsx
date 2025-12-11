'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'

interface Branch {
  id: string
  name: string
  slug: string
  city?: string
  country?: string
}

export default function BranchSwitcher() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [branches, setBranches] = useState<Branch[]>([])
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [churchId, setChurchId] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchBranches()
    }
  }, [session])

  const fetchBranches = async () => {
    try {
      const userRes = await fetch('/api/users/me')
      const userData = await userRes.json()
      
      if (userData.churchId) {
        setChurchId(userData.churchId)
        setCurrentBranchId(userData.branchId || null)
        
        const res = await fetch(`/api/churches/${userData.churchId}/branches`)
        if (res.ok) {
          const data = await res.json()
          setBranches(data)
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBranchChange = async (branchId: string) => {
    if (branchId === currentBranchId) return

    try {
      // Update user's branch preference
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: branchId || null }),
      })

      if (res.ok) {
        setCurrentBranchId(branchId || null)
        // Refresh the page to update context
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to switch branch')
      }
    } catch (error) {
      console.error('Error switching branch:', error)
      alert('An error occurred while switching branch')
    }
  }

  if (loading || !churchId || branches.length === 0) {
    return null // Don't show switcher if no branches
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Current Branch
      </label>
      <div className="flex items-center space-x-3">
        <select
          value={currentBranchId || ''}
          onChange={(e) => handleBranchChange(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
        >
          <option value="">All Branches (Main)</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} {branch.city ? `- ${branch.city}` : ''}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500">
          {branches.length} {branches.length === 1 ? 'branch' : 'branches'}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Switch branches to filter content by location
      </p>
    </div>
  )
}

