'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatDateTime } from '@/lib/utils'

interface Conversation {
  partner: {
    id: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  lastMessage: {
    content: string
    createdAt: string
    senderId: string
  }
  unreadCount: number
}

interface Message {
  id: string
  content: string
  createdAt: string
  read?: boolean
  attachments?: {
    url: string
    name?: string
    contentType?: string
    size?: number
  }[]
  voiceNote?: {
    url: string
    duration?: number
  }
  sender?: {
    id: string
    firstName: string
    lastName: string
    profileImage?: string
  } | null
  receiver?: {
    id: string
    firstName: string
    lastName: string
    profileImage?: string
  } | null
  unitId?: string
}

interface DirectoryUser {
  id: string
  firstName: string
  lastName: string
  role: string
  branchId?: string
  profileImage?: string
}

interface DirectoryGroup {
  id: string
  name: string
  description?: string
  myRole?: string
  unitTypeId?: string
}

type SelectedTarget =
  | { type: 'direct'; id: string }
  | { type: 'group'; id: string }

export default function Messaging() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<'conversations' | 'directory'>('conversations')
  const [directoryTab, setDirectoryTab] = useState<'people' | 'groups'>('people')
  const [directoryUsers, setDirectoryUsers] = useState<DirectoryUser[]>([])
  const [directoryGroups, setDirectoryGroups] = useState<DirectoryGroup[]>([])
  const [directoryLoading, setDirectoryLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([])
  const [groupSearch, setGroupSearch] = useState('')
  const [attachments, setAttachments] = useState<NonNullable<Message['attachments']>>([])
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [voiceNote, setVoiceNote] = useState<Message['voiceNote'] | null>(null)
  const [voiceUploading, setVoiceUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingStartRef = useRef<number | null>(null)

  const loadBranches = useCallback(async () => {
    try {
      const res = await fetch('/api/churches/switch', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      const churchId = data?.churchId
      if (!churchId) return

      const branchRes = await fetch(`/api/churches/${churchId}/branches`, { cache: 'no-store' })
      if (!branchRes.ok) return
      const branchJson = await branchRes.json()
      setBranches(branchJson || [])
    } catch (error) {
      console.error('Error loading branches:', error)
    }
  }, [])

  const loadCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/users/me', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json().catch(() => null)
      if (data?.id) {
        setCurrentUserId(data.id)
      }
    } catch (error) {
      console.error('Error loading current user:', error)
    }
  }, [])

  const loadDirectoryUsers = useCallback(async () => {
    setDirectoryLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (userSearch.trim()) params.append('search', userSearch.trim())
      if (roleFilter) params.append('role', roleFilter)
      if (branchFilter) params.append('branchId', branchFilter)

      const response = await fetch(`/api/users?${params.toString()}`, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to load users')
      }
      const data = await response.json().catch(() => ({}))
      setDirectoryUsers(data.users || [])
    } catch (error) {
      console.error('Error loading directory users:', error)
    } finally {
      setDirectoryLoading(false)
    }
  }, [branchFilter, roleFilter, userSearch])

  const loadDirectoryGroups = useCallback(async () => {
    setDirectoryLoading(true)
    try {
      const response = await fetch('/api/units/mine', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to load groups')
      }
      const data = await response.json().catch(() => ({}))
      setDirectoryGroups(data.units || [])
    } catch (error) {
      console.error('Error loading directory groups:', error)
    } finally {
      setDirectoryLoading(false)
    }
  }, [])

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }, [])

  const loadMessages = useCallback(async () => {
    if (!selectedTarget) return

    try {
      if (selectedTarget.type === 'direct') {
        const response = await fetch(`/api/messages?conversationId=${selectedTarget.id}`)
        if (response.ok) {
          const data = await response.json()
          setMessages(Array.isArray(data) ? data : [])
        }
      } else {
        const response = await fetch(`/api/units/${selectedTarget.id}/messages`, { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json().catch(() => ({}))
          const normalized = (data.messages || []).map((message: any) => ({
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            attachments: message.attachments || [],
            voiceNote: message.voiceNote || null,
            sender: message.user
              ? {
                  id: message.user.id,
                  firstName: message.user.firstName,
                  lastName: message.user.lastName,
                  profileImage: message.user.profileImage,
                }
              : null,
            unitId: message.unitId,
          }))
          setMessages(normalized)
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [selectedTarget])

  useEffect(() => {
    loadConversations()
    loadDirectoryGroups()
    loadCurrentUser()
  }, [loadConversations, loadDirectoryGroups, loadCurrentUser])

  useEffect(() => {
    if (selectedTarget) {
      loadMessages()
      const interval = setInterval(loadMessages, 5000) // Poll every 5 seconds
      return () => clearInterval(interval)
    }
  }, [selectedTarget, loadMessages])

  useEffect(() => {
    loadBranches()
  }, [loadBranches])

  useEffect(() => {
    if (viewMode === 'directory') {
      if (directoryTab === 'people') {
        loadDirectoryUsers()
      } else {
        loadDirectoryGroups()
      }
    }
  }, [viewMode, directoryTab, loadDirectoryUsers, loadDirectoryGroups])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSelectUser = (userId: string) => {
    setSelectedTarget({ type: 'direct', id: userId })
    setViewMode('conversations')
  }

  const handleSelectGroup = (groupId: string) => {
    setSelectedTarget({ type: 'group', id: groupId })
    setViewMode('conversations')
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTarget || sending) return

    const content = input.trim()
    if (!content && attachments.length === 0 && !voiceNote) {
      return
    }

    setInput('')
    setSending(true)

    try {
      const endpointConfig =
        selectedTarget.type === 'direct'
          ? {
              url: '/api/messages',
              body: {
                receiverId: selectedTarget.id,
                content,
                attachments,
                voiceNote,
              },
            }
          : {
              url: `/api/units/${selectedTarget.id}/messages`,
              body: {
                content,
                attachments,
                voiceNote,
              },
            }

      const response = await fetch(endpointConfig.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(endpointConfig.body),
      })

      if (response.ok) {
        loadMessages()
        if (selectedTarget.type === 'direct') {
          loadConversations()
        }
        setAttachments([])
        setVoiceNote(null)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const uploadMessageFile = async (file: File, kind: 'attachment' | 'voice', duration?: number) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('kind', kind)

    try {
      if (kind === 'attachment') {
        setAttachmentUploading(true)
        setAttachmentError(null)
      } else {
        setVoiceUploading(true)
        setRecordingError(null)
      }

      const res = await fetch('/api/messages/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Upload failed')
      }

      const data = await res.json()

      if (kind === 'attachment') {
        setAttachments((prev) => [...prev, { url: data.url, name: data.name, size: data.size, contentType: data.contentType }])
      } else {
        setVoiceNote({
          url: data.url,
          duration: duration ?? voiceNote?.duration,
        })
      }
    } catch (error: any) {
      if (kind === 'attachment') {
        setAttachmentError(error.message || 'Failed to upload attachment')
      } else {
        setRecordingError(error.message || 'Failed to upload voice note')
      }
    } finally {
      if (kind === 'attachment') {
        setAttachmentUploading(false)
      } else {
        setVoiceUploading(false)
      }
    }
  }

  const handleAttachmentChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await uploadMessageFile(file, 'attachment')
    event.target.value = ''
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices) {
        setRecordingError('This browser does not support audio recording.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      recordingChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: blob.type })
        const started = recordingStartRef.current
        const durationSeconds = started ? (Date.now() - started) / 1000 : undefined
        await uploadMessageFile(file, 'voice', durationSeconds)
        stream.getTracks().forEach((track) => track.stop())
        setRecording(false)
        recordingStartRef.current = null
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      recordingStartRef.current = Date.now()
      setRecording(true)
      setRecordingError(null)
    } catch (error: any) {
      console.error('Error starting recording:', error)
      setRecordingError(error.message || 'Failed to start recording')
      setRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
    }
  }

  const cancelVoiceNote = () => {
    setVoiceNote(null)
    setRecording(false)
    setRecordingError(null)
    recordingStartRef.current = null
    recordingChunksRef.current = []
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      mediaRecorderRef.current.stop()
    }
  }

  const selectedConv =
    selectedTarget?.type === 'direct'
      ? conversations.find((c) => c.partner.id === selectedTarget.id)
      : null

  const selectedGroup =
    selectedTarget?.type === 'group'
      ? directoryGroups.find((group) => group.id === selectedTarget.id)
      : null

  const normalizedGroupSearch = groupSearch.trim().toLowerCase()
  const filteredGroups = useMemo(
    () =>
      directoryGroups
        .filter((group) =>
          !normalizedGroupSearch ? true : group.name?.toLowerCase().includes(normalizedGroupSearch)
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [directoryGroups, normalizedGroupSearch]
  )

  const roleOptions = [
    { value: '', label: 'All roles' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'PASTOR', label: 'Pastor' },
    { value: 'BRANCH_ADMIN', label: 'Branch Admin' },
    { value: 'STAFF', label: 'Staff' },
    { value: 'LEADER', label: 'Leader' },
    { value: 'MEMBER', label: 'Member' },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>

      <div className="bg-white rounded-lg shadow-lg flex" style={{ height: '600px' }}>
        {/* Conversations List */}
        <div className="w-1/3 border-r overflow-y-auto">
          <div className="p-4 border-b space-y-3">
            <h2 className="font-semibold">Team Hub</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode('conversations')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                  viewMode === 'conversations'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Conversations
              </button>
              <button
                type="button"
                onClick={() => setViewMode('directory')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                  viewMode === 'directory'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Directory
              </button>
            </div>
          </div>
          {viewMode === 'conversations' ? (
            conversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">✉️</div>
                <p className="text-gray-600 mb-2">No conversations yet</p>
                <p className="text-sm text-gray-500">
                  Start a conversation by messaging a member or joining a group
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.partner.id}
                  onClick={() => handleSelectUser(conv.partner.id)}
                  className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${
                    selectedTarget?.type === 'direct' && selectedTarget.id === conv.partner.id
                      ? 'bg-primary-50'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                      {conv.partner.profileImage ? (
                        <img
                          src={conv.partner.profileImage}
                          alt={`${conv.partner.firstName} ${conv.partner.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-primary-600 font-medium">
                          {conv.partner.firstName[0]}
                          {conv.partner.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {conv.partner.firstName} {conv.partner.lastName}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {conv.lastMessage.content}
                      </div>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )
          ) : (
            <div className="p-4 space-y-4">
              <div className="flex rounded-lg bg-gray-100 p-1 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => setDirectoryTab('people')}
                  className={`flex-1 rounded-md px-3 py-2 ${
                    directoryTab === 'people' ? 'bg-white shadow text-primary-600' : 'text-gray-600'
                  }`}
                >
                  People
                </button>
                <button
                  type="button"
                  onClick={() => setDirectoryTab('groups')}
                  className={`flex-1 rounded-md px-3 py-2 ${
                    directoryTab === 'groups' ? 'bg-white shadow text-primary-600' : 'text-gray-600'
                  }`}
                >
                  Groups
                </button>
              </div>

              {directoryTab === 'people' ? (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Search</label>
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Name or email"
                        className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Role</label>
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        {roleOptions.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Branch</label>
                      <select
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">All branches</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2 max-h-[360px] overflow-y-auto">
                    {directoryLoading ? (
                      <div className="text-center text-gray-500 text-sm">Loading members...</div>
                    ) : directoryUsers.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm">No users match your filters.</div>
                    ) : (
                      directoryUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleSelectUser(user.id)}
                          className="w-full text-left border rounded-lg px-3 py-2 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden text-sm font-semibold text-gray-600">
                              {user.profileImage ? (
                                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <>
                                  {user.firstName?.[0]}
                                  {user.lastName?.[0]}
                                </>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-gray-500 flex gap-2 flex-wrap">
                                <span className="uppercase tracking-wide">{user.role}</span>
                                {user.branchId && (
                                  <span>
                                    •{' '}
                                    {branches.find((b) => b.id === user.branchId)?.name || 'Branch'}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Search groups</label>
                    <input
                      type="text"
                      value={groupSearch}
                      onChange={(e) => setGroupSearch(e.target.value)}
                      placeholder="Group name"
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="border-t pt-4 space-y-2 max-h-[360px] overflow-y-auto">
                    {directoryLoading ? (
                      <div className="text-center text-gray-500 text-sm">Loading groups...</div>
                    ) : filteredGroups.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm">
                        {groupSearch.trim() ? 'No groups match your search.' : 'You have not joined any groups yet.'}
                      </div>
                    ) : (
                      filteredGroups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => handleSelectGroup(group.id)}
                          className={`w-full text-left border rounded-lg px-3 py-2 hover:bg-gray-50 transition ${
                            selectedTarget?.type === 'group' && selectedTarget.id === group.id
                              ? 'border-primary-300 bg-primary-50'
                              : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{group.name}</p>
                              {group.description && (
                                <p className="text-xs text-gray-500 line-clamp-2">{group.description}</p>
                              )}
                            </div>
                            {group.myRole && (
                              <span className="text-[11px] uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {group.myRole.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          {selectedTarget ? (
            <>
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase text-gray-500 font-semibold tracking-wide">
                      {selectedTarget.type === 'group' ? 'Group chat' : 'Direct message'}
                    </p>
                    <h2 className="text-lg font-semibold">
                      {selectedTarget.type === 'group'
                        ? selectedGroup?.name || 'Group'
                        : `${selectedConv?.partner.firstName ?? ''} ${selectedConv?.partner.lastName ?? ''}`}
                    </h2>
                  </div>
                  {selectedTarget.type === 'group' && selectedGroup?.myRole && (
                    <span className="text-xs uppercase tracking-wide text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {selectedGroup.myRole.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const senderId = message.sender?.id || message.senderId
                  const isOwn = currentUserId && senderId ? senderId === currentUserId : false
                  const initials =
                    (message.sender?.firstName?.[0] || '') + (message.sender?.lastName?.[0] || '')

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${isOwn ? 'flex-row-reverse text-right' : ''}`}
                    >
                      {selectedTarget.type === 'group' && (
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden text-sm font-semibold text-gray-600">
                          {message.sender?.profileImage ? (
                            <img
                              src={message.sender.profileImage}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            initials || '👤'
                          )}
                        </div>
                      )}
                      <div className="max-w-[70%]">
                        {selectedTarget.type === 'group' && (
                          <p className="text-xs font-semibold text-gray-500 mb-1">
                            {message.sender
                              ? `${message.sender.firstName} ${message.sender.lastName}`
                              : 'Unknown'}
                          </p>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 shadow-sm ${
                            isOwn
                              ? 'bg-primary-600 text-white rounded-br-none'
                              : 'bg-gray-100 text-gray-900 rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                          <p
                            className={`text-[11px] mt-1 ${
                              isOwn ? 'text-primary-100' : 'text-gray-500'
                            }`}
                          >
                            {formatDateTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      selectedTarget.type === 'group'
                        ? `Message ${selectedGroup?.name || 'this group'}...`
                        : 'Type a message...'
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 px-12 text-center space-y-4">
              <div className="text-5xl">💬</div>
              <p className="text-lg font-semibold text-gray-700">Choose a conversation to get started</p>
              <p className="text-sm text-gray-500">
                Select a person or group from the left to view and send messages. Directory filters help you find the right people, while the Groups tab automatically lists every group you belong to.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

