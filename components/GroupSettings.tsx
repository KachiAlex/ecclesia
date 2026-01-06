'use client'

import { useState, useEffect, useCallback } from 'react'

type Unit = {
  id: string
  name: string
  description?: string
  unitTypeId: string
  headUserId: string
  branchId?: string
  permissions?: {
    invitePolicy?: 'HEAD_ONLY' | 'ANY_MEMBER'
  }
}

type UnitMembership = {
  id: string
  userId: string
  role: 'HEAD' | 'MEMBER'
  createdAt: string
  user?: {
    id: string
    firstName?: string
    lastName?: string
    email?: string
    profileImage?: string | null
  } | null
}

type UnitSettings = {
  allowMedia: boolean
  allowPolls: boolean
  allowShares: boolean
  pinnedRules?: string | null
  rules?: Array<{
    title: string
    description?: string
  }>
}

type UserRow = {
  id: string
  firstName?: string
  lastName?: string
  email?: string
}

interface GroupSettingsProps {
  unitId: string
  unit: Unit
  members: UnitMembership[]
  isHead: boolean
  isAdmin: boolean
  onUpdate: () => void
}

function parseApiError(err: any): string {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err
  if (err?.message) return String(err.message)
  return 'Request failed'
}

export default function GroupSettings({ unitId, unit, members, isHead, isAdmin, onUpdate }: GroupSettingsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'rules' | 'invites'>('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // General settings
  const [unitName, setUnitName] = useState(unit.name)
  const [unitDescription, setUnitDescription] = useState(unit.description || '')
  const [invitePolicy, setInvitePolicy] = useState(unit.permissions?.invitePolicy || 'HEAD_ONLY')

  // Unit settings
  const [settings, setSettings] = useState<UnitSettings>({
    allowMedia: true,
    allowPolls: true,
    allowShares: true,
    pinnedRules: null,
    rules: []
  })

  // Member management
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<UserRow[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)

  // Invite link
  const [inviteLink, setInviteLink] = useState('')
  const [generatingLink, setGeneratingLink] = useState(false)

  // Rules management
  const [newRuleTitle, setNewRuleTitle] = useState('')
  const [newRuleDescription, setNewRuleDescription] = useState('')
  const [pinnedMessage, setPinnedMessage] = useState(settings.pinnedRules || '')

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/units/${unitId}/settings`)
      if (res.ok) {
        const data = await res.json()
        setSettings((prev) => data.settings || prev)
        setPinnedMessage(data.settings?.pinnedRules || '')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }, [unitId])

  const generateInviteLink = useCallback(async () => {
    setGeneratingLink(true)
    try {
      const res = await fetch(`/api/units/${unitId}/invite-link`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        setInviteLink(data.inviteLink)
      }
    } catch (error) {
      console.error('Error generating invite link:', error)
    } finally {
      setGeneratingLink(false)
    }
  }, [unitId])

  useEffect(() => {
    loadSettings()
    generateInviteLink()
  }, [loadSettings, generateInviteLink])

  const saveGeneralSettings = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/units/${unitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: unitName,
          description: unitDescription || undefined,
          permissions: isAdmin ? { invitePolicy } : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to update group')
      setSuccess('Group settings updated successfully!')
      onUpdate()
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setLoading(false)
    }
  }

  const saveUnitSettings = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/units/${unitId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          pinnedRules: pinnedMessage || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to update settings')
      setSuccess('Group rules updated successfully!')
      loadSettings()
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    if (!userSearch.trim()) return
    setSearchingUsers(true)
    setError('')
    try {
      const q = encodeURIComponent(userSearch.trim())
      const res = await fetch(`/api/users?search=${q}&limit=10&page=1`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to search users')
      setUserResults((data.users || []) as UserRow[])
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setSearchingUsers(false)
    }
  }

  const inviteUser = async (userId: string) => {
    setError('')
    try {
      const res = await fetch(`/api/units/${unitId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to invite user')
      setSuccess('User invited successfully!')
      setUserSearch('')
      setUserResults([])
      onUpdate()
    } catch (e: any) {
      setError(parseApiError(e))
    }
  }

  const changeUserRole = async (membershipId: string, newRole: 'HEAD' | 'MEMBER') => {
    setError('')
    try {
      const res = await fetch(`/api/units/${unitId}/members/${membershipId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to change role')
      setSuccess('Member role updated successfully!')
      onUpdate()
    } catch (e: any) {
      setError(parseApiError(e))
    }
  }

  const removeMember = async (membershipId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    setError('')
    try {
      const res = await fetch(`/api/units/${unitId}/members/${membershipId}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to remove member')
      setSuccess('Member removed successfully!')
      onUpdate()
    } catch (e: any) {
      setError(parseApiError(e))
    }
  }

  const addRule = () => {
    if (!newRuleTitle.trim()) return
    const newRule = {
      title: newRuleTitle.trim(),
      description: newRuleDescription.trim() || undefined,
    }
    setSettings(prev => ({
      ...prev,
      rules: [...(prev.rules || []), newRule]
    }))
    setNewRuleTitle('')
    setNewRuleDescription('')
  }

  const removeRule = (index: number) => {
    setSettings(prev => ({
      ...prev,
      rules: (prev.rules || []).filter((_, i) => i !== index)
    }))
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setSuccess('Invite link copied to clipboard!')
  }

  const canManageMembers = isHead || isAdmin
  const canEditSettings = isHead || isAdmin

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
        <h2 className="text-lg sm:text-xl font-semibold">Group Settings</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your group configuration and members</p>
      </div>

      {error && (
        <div className="mx-4 sm:mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mx-4 sm:mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 px-4 sm:px-6">
        <nav className="flex gap-2 sm:gap-6 overflow-x-auto">
          {(['general', 'members', 'rules', 'invites'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 sm:px-3 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'general' ? 'General' : 
               tab === 'members' ? 'Members' :
               tab === 'rules' ? 'Rules' : 'Invites'}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 sm:p-6">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name
              </label>
              <input
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base"
                disabled={!canEditSettings}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={unitDescription}
                onChange={(e) => setUnitDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base"
                rows={3}
                disabled={!canEditSettings}
              />
            </div>

            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Permission
                </label>
                <select
                  value={invitePolicy}
                  onChange={(e) => setInvitePolicy(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base"
                >
                  <option value="HEAD_ONLY">Only Group Leader can invite</option>
                  <option value="ANY_MEMBER">Any Member can invite</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.allowMedia}
                  onChange={(e) => setSettings(prev => ({ ...prev, allowMedia: e.target.checked }))}
                  disabled={!canEditSettings}
                />
                <span className="text-sm">Allow media sharing</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.allowPolls}
                  onChange={(e) => setSettings(prev => ({ ...prev, allowPolls: e.target.checked }))}
                  disabled={!canEditSettings}
                />
                <span className="text-sm">Enable polls</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.allowShares}
                  onChange={(e) => setSettings(prev => ({ ...prev, allowShares: e.target.checked }))}
                  disabled={!canEditSettings}
                />
                <span className="text-sm">Allow post sharing</span>
              </label>
            </div>

            {canEditSettings && (
              <button
                onClick={saveGeneralSettings}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            {canManageMembers && (
              <div>
                <h3 className="text-base sm:text-lg font-medium mb-4">Add Members</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base"
                    placeholder="Search by name or email"
                  />
                  <button
                    onClick={searchUsers}
                    disabled={searchingUsers || !userSearch.trim()}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 disabled:opacity-60 whitespace-nowrap"
                  >
                    {searchingUsers ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {userResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {userResults.map((user) => (
                      <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-100 rounded-lg p-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || user.id}
                          </div>
                          {user.email && <div className="text-xs text-gray-500 truncate">{user.email}</div>}
                        </div>
                        <button
                          onClick={() => inviteUser(user.id)}
                          className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm whitespace-nowrap"
                        >
                          Invite
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <h3 className="text-base sm:text-lg font-medium mb-4">Current Members ({members.length})</h3>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {member.user?.profileImage ? (
                        <img
                          src={member.user.profileImage}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-600 text-sm font-medium">
                            {member.user?.firstName?.[0] || member.user?.email?.[0] || member.userId[0]}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {[member.user?.firstName, member.user?.lastName].filter(Boolean).join(' ') || 
                           member.user?.email || member.userId}
                        </div>
                        {member.user?.email && (
                          <div className="text-sm text-gray-500 truncate">{member.user.email}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.role === 'HEAD' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {member.role === 'HEAD' ? 'Leader' : 'Member'}
                      </span>
                      {canManageMembers && (
                        <div className="flex flex-wrap gap-1">
                          {member.role === 'MEMBER' && (
                            <button
                              onClick={() => changeUserRole(member.id, 'HEAD')}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              title="Promote to Leader"
                            >
                              Promote
                            </button>
                          )}
                          {member.role === 'HEAD' && members.filter(m => m.role === 'HEAD').length > 1 && (
                            <button
                              onClick={() => changeUserRole(member.id, 'MEMBER')}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              title="Demote to Member"
                            >
                              Demote
                            </button>
                          )}
                          <button
                            onClick={() => removeMember(member.id)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            title="Remove Member"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pinned Message
              </label>
              <textarea
                value={pinnedMessage}
                onChange={(e) => setPinnedMessage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base"
                rows={3}
                placeholder="Add a pinned message for all group members to see"
                disabled={!canEditSettings}
              />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-medium mb-4">Group Rules</h3>
              {canEditSettings && (
                <div className="space-y-3 mb-4">
                  <input
                    value={newRuleTitle}
                    onChange={(e) => setNewRuleTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base"
                    placeholder="Rule title"
                  />
                  <input
                    value={newRuleDescription}
                    onChange={(e) => setNewRuleDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base"
                    placeholder="Rule description (optional)"
                  />
                  <button
                    onClick={addRule}
                    disabled={!newRuleTitle.trim()}
                    className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    Add Rule
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {(settings.rules || []).map((rule, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border border-gray-100 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="font-medium">{rule.title}</div>
                      {rule.description && (
                        <div className="text-sm text-gray-600 mt-1">{rule.description}</div>
                      )}
                    </div>
                    {canEditSettings && (
                      <button
                        onClick={() => removeRule(index)}
                        className="text-red-600 hover:text-red-800 text-sm whitespace-nowrap"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {(!settings.rules || settings.rules.length === 0) && (
                  <div className="text-gray-500 text-center py-4">No rules added yet</div>
                )}
              </div>
            </div>

            {canEditSettings && (
              <button
                onClick={saveUnitSettings}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Rules'}
              </button>
            )}
          </div>
        )}

        {/* Invites Tab */}
        {activeTab === 'invites' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-medium mb-4">Invite Link</h3>
              <p className="text-sm text-gray-600 mb-4">
                Share this link to allow people to join your group directly.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={inviteLink}
                  readOnly
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-sm sm:text-base"
                />
                <div className="flex gap-2">
                  <button
                    onClick={copyInviteLink}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 whitespace-nowrap"
                  >
                    Copy
                  </button>
                  <button
                    onClick={generateInviteLink}
                    disabled={generatingLink}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 disabled:opacity-50 whitespace-nowrap"
                  >
                    {generatingLink ? 'Generating...' : 'Regenerate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}