'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  question: string
  answer: string
  topic?: string
  createdAt: string
}

export default function AICoachingChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/ai/coaching/history?limit=10')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.reverse()) // Show oldest first
      }
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const question = input.trim()
    setInput('')
    setLoading(true)

    // Add user message immediately
    const userMessage: Message = {
      id: 'temp-' + Date.now(),
      question,
      answer: '',
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      const response = await fetch('/api/ai/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

      const data = await response.json()

      // Replace temp message with actual response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id
            ? {
                id: data.id,
                question: data.question,
                answer: data.answer,
                topic: data.topic,
                createdAt: data.createdAt,
              }
            : msg
        )
      )
    } catch (error: any) {
      // Show error message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id
            ? {
                ...msg,
                answer: `Error: ${error.message}`,
              }
            : msg
        )
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI Spiritual Coach</h1>
        <p className="text-gray-600">
          Ask any spiritual question and get Bible-based, pastor-approved guidance.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg flex flex-col" style={{ height: '600px' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loadingHistory ? (
            <div className="text-center text-gray-500">Loading conversation history...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p className="mb-2">Start a conversation with your AI spiritual coach!</p>
              <p className="text-sm">Ask questions about faith, prayer, Bible study, or any spiritual topic.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {/* User Question */}
                <div className="flex justify-end">
                  <div className="bg-primary-600 text-white rounded-lg px-4 py-2 max-w-[80%]">
                    <p className="font-medium">You</p>
                    <p>{message.question}</p>
                  </div>
                </div>

                {/* AI Answer */}
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%]">
                    <p className="font-medium text-primary-600 mb-1">AI Coach</p>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{message.answer}</p>
                    </div>
                    {message.topic && (
                      <p className="text-xs text-gray-500 mt-2">Topic: {message.topic}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a spiritual question..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

