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

export default function Messaging() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>

      <div className="bg-white rounded-lg shadow-lg flex" style={{ height: '600px' }}>
        {/* Conversations List */}
        <div className="w-1/3 border-r overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Conversations</h2>
          </div>
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No conversations yet
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

