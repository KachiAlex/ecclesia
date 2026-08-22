'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import GroupSettings from './GroupSettings'

type Unit = {
  id: string
  name: string
  description?: string
  unitTypeId: string
  headUserId: string
  branchId?: string
}

type UnitMemberUser = {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  profileImage?: string | null
}

type UnitMembership = {
  id: string
  userId: string
  role: 'HEAD' | 'MEMBER'
  createdAt: string
  user?: UnitMemberUser | null
}

type UnitPayload = {
  unit: Unit
  members: UnitMembership[]
  myMembership?: UnitMembership | null
}

type UserRow = {
  id: string
  firstName?: string
  lastName?: string
  email?: string
}

type PendingInvite = {
  id: string
  invitedUserId: string
  invitedByUserId: string
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'DECLINED'
  createdAt: string
}

type UnitRule = {
  title: string
  description?: string
}

type UnitSettingsPayload = {
  allowMedia: boolean
  allowPolls: boolean
  allowShares: boolean
  pinnedRules?: string | null
  rules?: UnitRule[]
}

type UnitMessageRow = {
  id: string
  content: string
  createdAt: string
  user?: {
    id: string
    firstName?: string
    lastName?: string
    profileImage?: string | null
  } | null
}

type UnitPollOptionRow = {
  id: string
  label: string
  votes: number
}

type UnitPollRow = {
  id: string
  question: string
  description?: string | null
  options: UnitPollOptionRow[]
  allowMultiple: boolean
  allowComments: boolean
  status: 'OPEN' | 'CLOSED'
  createdByUserId?: string
  createdBy?: {
    id: string
    firstName?: string
    lastName?: string
    profileImage?: string | null
  } | null
  createdAt?: string | null
  closesAt?: string | null
}

type PollFormOption = {
  id: string
  label: string
}

const MIN_POLL_OPTIONS = 2

const formatUserName = (user?: { firstName?: string; lastName?: string; id?: string } | null) => {
  if (!user) return 'Unknown member'
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return name || user.id || 'Member'
}

const formatMemberName = (member: UnitMembership) => {
  if (member.user) {
    const name = [member.user.firstName, member.user.lastName].filter(Boolean).join(' ').trim()
    if (name) return name
    if (member.user.email) return member.user.email
  }
  return member.userId
}

const createOptionId = () => Math.random().toString(36).slice(2)

function parseApiError(err: any): string {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err
  if (err?.message) return String(err.message)
  return 'Request failed'
}

export default function UnitDetails({ unitId }: { unitId: string }) {
  const [payload, setPayload] = useState<UnitPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [loadingInvites, setLoadingInvites] = useState(false)

  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<UserRow[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)

  const [settings, setSettings] = useState<UnitSettingsPayload | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [messages, setMessages] = useState<UnitMessageRow[]>([])
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [messageInput, setMessageInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [polls, setPolls] = useState<UnitPollRow[]>([])
  const [pollsLoading, setPollsLoading] = useState(true)
  const [activityTab, setActivityTab] = useState<'chat' | 'polls' | 'rules'>('chat')
  const [voteSelections, setVoteSelections] = useState<Record<string, string[]>>({})
  const [votingPollId, setVotingPollId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [newPollQuestion, setNewPollQuestion] = useState('')
  const [newPollDescription, setNewPollDescription] = useState('')
  const [newPollAllowMultiple, setNewPollAllowMultiple] = useState(false)
  const [newPollAllowComments, setNewPollAllowComments] = useState(true)
  const [newPollClosesAt, setNewPollClosesAt] = useState('')
  const [pollOptions, setPollOptions] = useState<PollFormOption[]>([
    { id: createOptionId(), label: '' },
    { id: createOptionId(), label: '' },
  ])
  const [creatingPoll, setCreatingPoll] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const isHead = useMemo(() => payload?.myMembership?.role === 'HEAD', [payload])
  const isMember = useMemo(() => Boolean(payload?.myMembership), [payload])
  const canChat = isAdmin || isMember
  const canCreatePoll = isAdmin || isHead

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/units/${unitId}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to load unit')
      setPayload(data)
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setLoading(false)
    }
  }, [unitId])

  const loadPendingInvites = useCallback(async () => {
    setLoadingInvites(true)
    setError('')
    try {
      const res = await fetch(`/api/units/${unitId}/invites/pending`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        // If you're not a head, this endpoint 403s. Just hide it.
        if (res.status === 403) {
          setPendingInvites([])
          return
        }
        throw new Error(data?.error || 'Failed to load pending invites')
      }
      setPendingInvites((data.invites || []) as PendingInvite[])
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setLoadingInvites(false)
    }
  }, [unitId])

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch(`/api/units/${unitId}/settings`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to load settings')
      setSettings(data.settings || null)
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setSettingsLoading(false)
    }
  }, [unitId])

  const loadMessages = useCallback(async () => {
    setMessagesLoading(true)
    try {
      const res = await fetch(`/api/units/${unitId}/messages`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to load messages')
      setMessages(data.messages || [])
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setMessagesLoading(false)
    }
  }, [unitId])

  const loadPolls = useCallback(async () => {
    setPollsLoading(true)
    try {
      const res = await fetch(`/api/units/${unitId}/polls`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to load polls')
      setPolls(data.polls || [])
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setPollsLoading(false)
    }
  }, [unitId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (isHead) {
      loadPendingInvites()
    }
  }, [isHead, loadPendingInvites])

  useEffect(() => {
    loadSettings()
    loadMessages()
    loadPolls()
  }, [loadSettings, loadMessages, loadPolls])

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/users/me')
        if (!res.ok) return
        const me = await res.json().catch(() => null)
        const role = String(me?.role || '')
        setIsAdmin(role === 'ADMIN' || role === 'SUPER_ADMIN')
      } catch {
        // ignore
      }
    }
    fetchMe()
  }, [])

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
      await load()
      await loadPendingInvites()
    } catch (e: any) {
      setError(parseApiError(e))
    }
  }

  const revokeInvite = async (inviteId: string) => {
    setError('')
    try {
      const res = await fetch(`/api/unit-invites/${inviteId}/revoke`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to revoke invite')
      await loadPendingInvites()
    } catch (e: any) {
      setError(parseApiError(e))
    }
  }

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault()
    if (!messageInput.trim() || !canChat) return
    setSendingMessage(true)
    setError('')
    try {
      const res = await fetch(`/api/units/${unitId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageInput.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to send message')
      setMessageInput('')
      await loadMessages()
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setSendingMessage(false)
    }
  }

  const handleVoteSelection = (pollId: string, optionId: string, allowMultiple: boolean) => {
    setVoteSelections((prev) => {
      const current = prev[pollId] || []
      if (allowMultiple) {
        const exists = current.includes(optionId)
        const next = exists ? current.filter((id) => id !== optionId) : [...current, optionId]
        return { ...prev, [pollId]: next }
      }
      return { ...prev, [pollId]: [optionId] }
    })
  }

  const submitVote = async (pollId: string) => {
    const selections = voteSelections[pollId] || []
    if (!selections.length) return
    setVotingPollId(pollId)
    setError('')
    try {
      const res = await fetch(`/api/units/${unitId}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIds: selections }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to record vote')
      setPolls((prev) => prev.map((poll) => (poll.id === pollId ? data.poll : poll)))
      setVoteSelections((prev) => ({ ...prev, [pollId]: [] }))
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setVotingPollId(null)
    }
  }

  const addPollOption = () => {
    setPollOptions((prev) => [...prev, { id: createOptionId(), label: '' }])
  }

  const updatePollOption = (id: string, label: string) => {
    setPollOptions((prev) => prev.map((option) => (option.id === id ? { ...option, label } : option)))
  }

  const removePollOption = (id: string) => {
    setPollOptions((prev) => (prev.length <= MIN_POLL_OPTIONS ? prev : prev.filter((option) => option.id !== id)))
  }

  const resetPollForm = () => {
    setNewPollQuestion('')
    setNewPollDescription('')
    setNewPollAllowMultiple(false)
    setNewPollAllowComments(true)
    setNewPollClosesAt('')
    setPollOptions([
      { id: createOptionId(), label: '' },
      { id: createOptionId(), label: '' },
    ])
  }

  const createPoll = async (event: FormEvent) => {
    event.preventDefault()
    if (!canCreatePoll || !settings?.allowPolls) return
    const trimmedOptions = pollOptions
      .map((option) => ({ ...option, label: option.label.trim() }))
      .filter((option) => option.label.length > 0)

    if (!newPollQuestion.trim()) {
      setError('Poll question is required')
      return
    }
    if (trimmedOptions.length < MIN_POLL_OPTIONS) {
      setError('Provide at least two poll options')
      return
    }

    setCreatingPoll(true)
    setError('')
    try {
      const res = await fetch(`/api/units/${unitId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newPollQuestion.trim(),
          description: newPollDescription.trim() || undefined,
          allowMultiple: newPollAllowMultiple,
          allowComments: newPollAllowComments,
          closesAt: newPollClosesAt || undefined,
          options: trimmedOptions.map((option) => ({ label: option.label })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to create poll')
      resetPollForm()
      await loadPolls()
    } catch (e: any) {
      setError(parseApiError(e))
    } finally {
      setCreatingPoll(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading unit...</div>
      </div>
    )
  }

  if (!payload) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Unit not found.</div>
      </div>
    )
  }

  const unit = payload.unit

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <a className="text-sm text-primary-700 hover:underline" href="/groups">
          Back to Groups
        </a>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">{unit.name}</h1>
            {unit.description && <p className="text-gray-700 mt-2">{unit.description}</p>}
            <div className="text-sm text-gray-500 mt-2">Unit ID: {unit.id}</div>
          </div>
          {(isHead || isAdmin) && (
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">{error}</p>
        </div>
      )}

      {isHead && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Invite Member</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm sm:text-base"
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
              {userResults.map((u) => (
                <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-100 rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || u.id}
                    </div>
                    {u.email && <div className="text-xs text-gray-500 truncate">{u.email}</div>}
                  </div>
                  <button
                    onClick={() => inviteUser(u.id)}
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

      {isHead && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">Pending Invites</h2>
          {loadingInvites ? (
            <div className="text-gray-600">Loading invites...</div>
          ) : pendingInvites.length === 0 ? (
            <div className="text-gray-600">No pending invites.</div>
          ) : (
            <div className="space-y-2">
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-100 rounded-lg p-3">
                  <div className="text-sm flex-1 min-w-0">
                    <div className="font-medium truncate">{inv.invitedUserId}</div>
                    <div className="text-xs text-gray-500">Invite ID: {inv.id}</div>
                  </div>
                  <button
                    onClick={() => revokeInvite(inv.id)}
                    className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-sm whitespace-nowrap"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto">
          {(['chat', 'polls', 'rules'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActivityTab(tab)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                activityTab === tab ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab === 'chat' ? 'Chat' : tab === 'polls' ? 'Polls' : 'Guidelines'}
            </button>
          ))}
        </div>

        {activityTab === 'chat' && (
          <div className="space-y-4">
            {messagesLoading ? (
              <div className="text-gray-600">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-gray-500">No conversations yet. Say hello to kick things off!</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {messages.map((message) => (
                  <div key={message.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-800">{formatUserName(message.user)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                    <p className="text-gray-700 mt-2 whitespace-pre-line">{message.content}</p>
                  </div>
                ))}
              </div>
            )}

            {canChat ? (
              <form onSubmit={sendMessage} className="space-y-2">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  rows={3}
                  disabled={sendingMessage}
                />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{settings?.allowMedia ? 'Media allowed' : 'Media restricted to leaders'}</span>
                  <button
                    type="submit"
                    disabled={sendingMessage || !messageInput.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-sm text-gray-500">You need to join this group to post messages. Ask a leader for an invite.</div>
            )}
          </div>
        )}

        {activityTab === 'polls' && (
          <div className="space-y-6">
            {pollsLoading ? (
              <div className="text-gray-600">Loading polls...</div>
            ) : polls.length === 0 ? (
              <div className="text-gray-500">No polls yet. Leaders can create one to gather quick feedback.</div>
            ) : (
              <div className="space-y-4">
                {polls.map((poll) => {
                  const selection = voteSelections[poll.id] || []
                  const isClosed = poll.status === 'CLOSED'
                  return (
                    <div key={poll.id} className="border border-gray-100 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{poll.question}</h3>
                          {poll.description && <p className="text-sm text-gray-600 mt-1">{poll.description}</p>}
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            isClosed ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {isClosed ? 'Closed' : 'Open'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {poll.options.map((option) => (
                          <label key={option.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2">
                            <div className="flex items-center gap-2">
                              {poll.allowMultiple ? (
                                <input
                                  type="checkbox"
                                  disabled={isClosed || votingPollId === poll.id}
                                  checked={selection.includes(option.id)}
                                  onChange={() => handleVoteSelection(poll.id, option.id, true)}
                                />
                              ) : (
                                <input
                                  type="radio"
                                  name={`poll-${poll.id}`}
                                  disabled={isClosed || votingPollId === poll.id}
                                  checked={selection.includes(option.id)}
                                  onChange={() => handleVoteSelection(poll.id, option.id, false)}
                                />
                              )}
                              <span className="text-sm text-gray-800">{option.label}</span>
                            </div>
                            <span className="text-xs text-gray-500">{option.votes} votes</span>
                          </label>
                        ))}
                      </div>

                      {!isClosed && canChat && (
                        <button
                          onClick={() => submitVote(poll.id)}
                          disabled={!selection.length || votingPollId === poll.id}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
                        >
                          {votingPollId === poll.id ? 'Submitting...' : 'Submit Vote'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {canCreatePoll && (
              <div className="border border-dashed border-primary-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Create Poll</h3>
                {!settings?.allowPolls ? (
                  <div className="text-sm text-gray-500">Polls are disabled for this group. Update settings to enable them.</div>
                ) : (
                  <form className="space-y-3" onSubmit={createPoll}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                      <input
                        value={newPollQuestion}
                        onChange={(e) => setNewPollQuestion(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                        placeholder="What topic should we focus on next?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={newPollDescription}
                        onChange={(e) => setNewPollDescription(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                        rows={2}
                        placeholder="Provide context (optional)"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={newPollAllowMultiple}
                          onChange={(e) => setNewPollAllowMultiple(e.target.checked)}
                        />
                        Allow multiple selections
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={newPollAllowComments}
                          onChange={(e) => setNewPollAllowComments(e.target.checked)}
                        />
                        Allow comments
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Closes At</label>
                      <input
                        type="datetime-local"
                        value={newPollClosesAt}
                        onChange={(e) => setNewPollClosesAt(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Options</label>
                        <button type="button" onClick={addPollOption} className="text-sm text-primary-600 hover:underline">
                          Add option
                        </button>
                      </div>
                      {pollOptions.map((option, index) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <input
                            value={option.label}
                            onChange={(e) => updatePollOption(option.id, e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2"
                            placeholder={`Option ${index + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removePollOption(option.id)}
                            className="text-sm text-gray-500 hover:text-red-500"
                            disabled={pollOptions.length <= MIN_POLL_OPTIONS}
                            title={pollOptions.length <= MIN_POLL_OPTIONS ? 'At least two options required' : 'Remove option'}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={creatingPoll}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
                    >
                      {creatingPoll ? 'Creating...' : 'Create Poll'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {activityTab === 'rules' && (
          <div className="space-y-4">
            {settingsLoading ? (
              <div className="text-gray-600">Loading guidelines...</div>
            ) : settings ? (
              <>
                {settings.pinnedRules ? (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                    <p className="text-sm font-semibold text-indigo-800 uppercase tracking-wide">Pinned reminder</p>
                    <p className="text-gray-800 mt-1 whitespace-pre-line">{settings.pinnedRules}</p>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No pinned reminders yet.</div>
                )}
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="border border-gray-100 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Media sharing</p>
                    <p className="text-sm font-semibold text-gray-900">{settings.allowMedia ? 'Allowed' : 'Leaders only'}</p>
                  </div>
                  <div className="border border-gray-100 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Polls</p>
                    <p className="text-sm font-semibold text-gray-900">{settings.allowPolls ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <div className="border border-gray-100 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Post sharing</p>
                    <p className="text-sm font-semibold text-gray-900">{settings.allowShares ? 'Allowed' : 'Restricted'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">House rules</p>
                  {settings.rules && settings.rules.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                      {settings.rules.map((rule, index) => (
                        <li key={index}>
                          <span className="font-medium">{rule.title}</span>
                          {rule.description && <span className="text-gray-500"> — {rule.description}</span>}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="text-sm text-gray-500">No custom rules added yet.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-gray-500">No interaction settings found.</div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-4">Members</h2>
        {payload.members.length === 0 ? (
          <div className="text-gray-600">No members yet.</div>
        ) : (
          <div className="space-y-2">
            {payload.members.map((m) => (
              <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between border border-gray-100 rounded-lg p-3 gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {m.user?.profileImage ? (
                    <img
                      src={m.user.profileImage}
                      alt={formatMemberName(m)}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 text-sm font-medium">
                        {m.user?.firstName?.[0] || m.user?.email?.[0] || m.userId[0]}
                      </span>
                    </div>
                  )}
                  <div className="text-sm flex-1 min-w-0">
                    <div className="font-medium truncate">{formatMemberName(m)}</div>
                    {m.user?.email && (
                      <div className="text-xs text-gray-500 truncate">{m.user.email}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    m.role === 'HEAD' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {m.role === 'HEAD' ? 'Leader' : 'Member'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Group Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold">Group Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <GroupSettings
                unitId={unitId}
                unit={unit}
                members={payload.members}
                isHead={isHead}
                isAdmin={isAdmin}
                onUpdate={() => {
                  load()
                  loadSettings()
                  setShowSettings(false)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
