'use client'

import { useState, useEffect, useRef } from 'react'
import { formatDate, formatDateTime } from '@/lib/utils'

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
  read: boolean
  sender: {
    id: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  receiver: {
    id: string
    firstName: string
    lastName: string
    profileImage?: string
  }
}

interface DirectoryUser {
  id: string
  firstName: string
  lastName: string
  role: string
  branchId?: string
  profileImage?: string
}

export default function Messaging() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<'conversations' | 'directory'>('conversations')
  const [directoryUsers, setDirectoryUsers] = useState<DirectoryUser[]>([])
  const [directoryLoading, setDirectoryLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages()
      const interval = setInterval(loadMessages, 5000) // Poll every 5 seconds
      return () => clearInterval(interval)
    }
  }, [selectedConversation])

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    if (viewMode === 'directory') {
      loadDirectoryUsers()
    }
  }, [viewMode, userSearch, roleFilter, branchFilter])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadBranches = async () => {
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
  }

  const loadDirectoryUsers = async () => {
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
  }

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const loadMessages = async () => {
    if (!selectedConversation) return

    try {
      const response = await fetch(`/api/messages?conversationId=${selectedConversation}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleSelectUser = (userId: string) => {
    setSelectedConversation(userId)
    setViewMode('conversations')
    loadMessages()
    loadConversations()
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selectedConversation || sending) return

    const content = input.trim()
    setInput('')
    setSending(true)

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedConversation,
          content,
        }),
      })

      if (response.ok) {
        loadMessages()
        loadConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const selectedConv = conversations.find(
    (c) => c.partner.id === selectedConversation
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
                  Start a conversation by messaging a member from the directory
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.partner.id}
                  onClick={() => setSelectedConversation(conv.partner.id)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedConversation === conv.partner.id ? 'bg-primary-50' : ''
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
                          {conv.partner.firstName[0]}{conv.partner.lastName[0]}
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
                </div>
              ))
            )
          ) : (
            <div className="p-4 space-y-4">
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
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b">
                <h2 className="font-semibold">
                  {selectedConv?.partner.firstName} {selectedConv?.partner.lastName}
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isOwn = message.sender.id !== selectedConversation
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isOwn
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? 'text-primary-100' : 'text-gray-500'
                          }`}
                        >
                          {formatDateTime(message.createdAt)}
                        </p>
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
                    placeholder="Type a message..."
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
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

