'use client'

import { useState, useEffect } from 'react'
import { Users, Building, UserCheck, Globe } from 'lucide-react'
import { TargetAudience } from '@/types/survey'

interface Group {
  id: string
  name: string
  type: string
  memberCount: number
}

interface Role {
  id: string
  name: string
  level: string
}

interface TargetAudienceSelectorProps {
  targetAudience: TargetAudience
  onChange: (audience: TargetAudience) => void
  userRole: string
  churchId: string
}

export default function TargetAudienceSelector({
  targetAudience,
  onChange,
  userRole,
  churchId
}: TargetAudienceSelectorProps) {
  const [availableGroups, setAvailableGroups] = useState<Group[]>([])
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data - in real implementation, fetch from API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAvailableGroups([
        { id: '1', name: 'Youth Ministry', type: 'ministry', memberCount: 45 },
        { id: '2', name: 'Worship Team', type: 'ministry', memberCount: 12 },
        { id: '3', name: 'Small Group Alpha', type: 'small_group', memberCount: 8 },
        { id: '4', name: 'Small Group Beta', type: 'small_group', memberCount: 10 },
        { id: '5', name: 'Board Members', type: 'leadership', memberCount: 7 }
      ])
      
      setAvailableRoles([
        { id: 'member', name: 'Members', level: 'basic' },
        { id: 'leader', name: 'Leaders', level: 'intermediate' },
        { id: 'pastor', name: 'Pastors', level: 'advanced' },
        { id: 'admin', name: 'Administrators', level: 'advanced' }
      ])
      
      setLoading(false)
    }, 500)
  }, [churchId])

  const updateAudience = (updates: Partial<TargetAudience>) => {
    onChange({ ...targetAudience, ...updates })
  }

  const toggleGroup = (groupId: string) => {
    const currentGroups = targetAudience.groupIds || []
    const newGroups = currentGroups.includes(groupId)
      ? currentGroups.filter(id => id !== groupId)
      : [...currentGroups, groupId]
    
    updateAudience({ groupIds: newGroups })
  }

  const toggleRole = (roleId: string) => {
    const currentRoles = targetAudience.roleIds || []
    const newRoles = currentRoles.includes(roleId)
      ? currentRoles.filter(id => id !== roleId)
      : [...currentRoles, roleId]
    
    updateAudience({ roleIds: newRoles })
  }

  const getEstimatedReach = () => {
    if (targetAudience.type === 'all') {
      return 'All church members'
    }
    
    let count = 0
    
    if (targetAudience.type === 'groups' && targetAudience.groupIds) {
      targetAudience.groupIds.forEach(groupId => {
        const group = availableGroups.find(g => g.id === groupId)
        if (group) count += group.memberCount
      })
    }
    
    if (targetAudience.type === 'roles' && targetAudience.roleIds) {
      // Simplified estimation - in real app, would need actual role counts
      count = targetAudience.roleIds.length * 20
    }
    
    if (targetAudience.type === 'custom') {
      const groupCount = (targetAudience.groupIds || []).reduce((sum, groupId) => {
        const group = availableGroups.find(g => g.id === groupId)
        return sum + (group?.memberCount || 0)
      }, 0)
      
      const roleCount = (targetAudience.roleIds || []).length * 15
      count = groupCount + roleCount
    }
    
    return count > 0 ? `Approximately ${count} people` : 'No recipients selected'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Target Audience</h2>
        <p className="text-gray-600 text-sm">Choose who should receive this survey</p>
      </div>

      {/* Audience Type Selection */}
      <div className="space-y-3">
        <h3 className="text-md font-medium text-gray-900">Audience Type</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="audienceType"
              value="all"
              checked={targetAudience.type === 'all'}
              onChange={(e) => updateAudience({ type: e.target.value as any, groupIds: [], roleIds: [] })}
              className="mt-1 text-primary-600 focus:ring-primary-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">All Members</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Send to everyone in the church</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="audienceType"
              value="groups"
              checked={targetAudience.type === 'groups'}
              onChange={(e) => updateAudience({ type: e.target.value as any, roleIds: [] })}
              className="mt-1 text-primary-600 focus:ring-primary-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">Specific Groups</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Select ministries or small groups</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="audienceType"
              value="roles"
              checked={targetAudience.type === 'roles'}
              onChange={(e) => updateAudience({ type: e.target.value as any, groupIds: [] })}
              className="mt-1 text-primary-600 focus:ring-primary-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">By Role</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Target specific roles or positions</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="audienceType"
              value="custom"
              checked={targetAudience.type === 'custom'}
              onChange={(e) => updateAudience({ type: e.target.value as any })}
              className="mt-1 text-primary-600 focus:ring-primary-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">Custom Selection</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Mix of groups and roles</p>
            </div>
          </label>
        </div>
      </div>

      {/* Group Selection */}
      {(targetAudience.type === 'groups' || targetAudience.type === 'custom') && (
        <div className="space-y-3">
          <h3 className="text-md font-medium text-gray-900">Select Groups</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {availableGroups.map((group) => (
              <label
                key={group.id}
                className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={(targetAudience.groupIds || []).includes(group.id)}
                  onChange={() => toggleGroup(group.id)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{group.name}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="capitalize">{group.type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{group.memberCount} members</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Role Selection */}
      {(targetAudience.type === 'roles' || targetAudience.type === 'custom') && (
        <div className="space-y-3">
          <h3 className="text-md font-medium text-gray-900">Select Roles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {availableRoles.map((role) => (
              <label
                key={role.id}
                className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={(targetAudience.roleIds || []).includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{role.name}</span>
                  <div className="text-xs text-gray-600 capitalize">{role.level} access level</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Estimated Reach */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-1">Estimated Reach</h4>
        <p className="text-sm text-blue-800">{getEstimatedReach()}</p>
      </div>

      {/* Permission Notice */}
      {userRole !== 'admin' && userRole !== 'pastor' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-1">Permission Notice</h4>
          <p className="text-sm text-yellow-700">
            As a {userRole}, you can only send surveys to groups you lead or manage. 
            Some options may be restricted based on your permissions.
          </p>
        </div>
      )}
    </div>
  )
}