'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import CreateBranchModal from '@/components/branches/CreateBranchModal'
import BranchCard from '@/components/branches/BranchCard'
import BranchAdminModal from '@/components/branches/BranchAdminModal'

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

export default function BranchesPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string | undefined
  const isMember = role === 'MEMBER'
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [churchId, setChurchId] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchBranches()
    }
  }, [session])

  const fetchBranches = async () => {
    try {
      const userId = (session?.user as any)?.id
      if (!userId) return

      // Get user's church ID
      const userRes = await fetch('/api/users/me')
      const userData = await userRes.json()
      
      if (userData.churchId) {
        setChurchId(userData.churchId)
        
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

  const handleBranchCreated = () => {
    setShowCreateModal(false)
    fetchBranches()
  }

  const handleBranchDeleted = () => {
    fetchBranches()
  }

  const handleManageAdmins = (branch: Branch) => {
    if (isMember) return
    setSelectedBranch(branch)
    setShowAdminModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Church Branches</h1>
          <p className="text-gray-600 mt-1">Manage your church branches and their admins</p>
        </div>
        {churchId && !isMember && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            + Create Branch
          </button>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start">
          <div className="text-blue-600 text-xl mr-3">ℹ️</div>
          <div>
            <h3 className="text-blue-900 font-semibold mb-1">About Branches</h3>
            <p className="text-blue-800 text-sm">
              Branches allow you to manage multiple locations or campuses of your church. Each branch can have its own admins, members, events, and groups while sharing the same church organization.
            </p>
          </div>
        </div>
      </div>

      {/* Branches Grid */}
      {branches.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🏛️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Branches Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first branch to start managing multiple locations or campuses.
          </p>
          {churchId && !isMember && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Your First Branch
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onDelete={handleBranchDeleted}
              onManageAdmins={() => handleManageAdmins(branch)}
              canManage={!isMember}
            />
          ))}
        </div>
      )}

      {/* Create Branch Modal */}
      {showCreateModal && churchId && (
        <CreateBranchModal
          churchId={churchId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleBranchCreated}
        />
      )}

      {/* Branch Admin Modal */}
      {showAdminModal && selectedBranch && churchId && (
        <BranchAdminModal
          churchId={churchId}
          branchId={selectedBranch.id}
          branchName={selectedBranch.name}
          onClose={() => {
            setShowAdminModal(false)
            setSelectedBranch(null)
          }}
        />
      )}
    </div>
  )
}

