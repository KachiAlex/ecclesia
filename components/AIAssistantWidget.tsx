'use client'

import { useState, useEffect, useCallback } from 'react'
import { Cake, Bell, X, MessageSquare, Sparkles, ChevronRight } from 'lucide-react'

interface BirthdayAlert {
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  upcomingBirthday: string
  ageTurning: number
  daysUntilBirthday: number
  profileImage: string | null
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  actionUrl: string | null
  actionLabel: string | null
  status: string
}

export default function AIAssistantWidget() {
  const [birthdays, setBirthdays] = useState<BirthdayAlert[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [generatedMessages, setGeneratedMessages] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'birthdays' | 'notifications'>('birthdays')

  const fetchData = useCallback(async () => {
    try {
      const [bdRes, notifRes] = await Promise.all([
        fetch('/api/ai-assistant/birthdays?days=30'),
        fetch('/api/ai-assistant/notifications'),
      ])

      if (bdRes.ok) {
        const bdData = await bdRes.json()
        setBirthdays(bdData.birthdays || [])
      }

      if (notifRes.ok) {
        const notifData = await notifRes.json()
        setNotifications(notifData.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching AI assistant data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleGenerateMessage = async (userId: string) => {
    setGenerating(userId)
    try {
      const res = await fetch('/api/ai-assistant/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'birthday' }),
      })
      if (res.ok) {
        const data = await res.json()
        setGeneratedMessages((prev) => ({ ...prev, [userId]: data.message }))
      }
    } catch (error) {
      console.error('Error generating message:', error)
    } finally {
      setGenerating(null)
    }
  }

  const handleDismissNotification = async (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    await fetch('/api/ai-assistant/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId, action: 'dismiss' }),
    })
  }

  const formatBirthday = (bd: BirthdayAlert) => {
    const date = new Date(bd.upcomingBirthday)
    const month = date.toLocaleString('default', { month: 'short' })
    const day = date.getDate()
    if (bd.daysUntilBirthday === 0) return `Today! 🎉`
    if (bd.daysUntilBirthday === 1) return `Tomorrow`
    return `${month} ${day} (in ${bd.daysUntilBirthday}d)`
  }

  const hasBirthdays = birthdays.length > 0
  const hasNotifications = notifications.length > 0
  const hasContent = hasBirthdays || hasNotifications

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-50 rounded-xl"></div>
          <div className="h-16 bg-gray-50 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (!hasContent) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">AI Assistant</h2>
        </div>
        <div className="flex gap-1">
          {hasBirthdays && (
            <button
              onClick={() => setActiveTab('birthdays')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'birthdays'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Cake className="w-3.5 h-3.5 inline mr-1" />
              {birthdays.length}
            </button>
          )}
          {hasNotifications && (
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bell className="w-3.5 h-3.5 inline mr-1" />
              {notifications.length}
            </button>
          )}
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {activeTab === 'birthdays' && hasBirthdays && (
          <div className="divide-y divide-gray-50">
            {birthdays.slice(0, 10).map((bd) => (
              <div key={bd.userId} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {bd.profileImage ? (
                      <img src={bd.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      bd.firstName[0]
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {bd.firstName} {bd.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      <Cake className="w-3 h-3 inline mr-1" />
                      {formatBirthday(bd)} · Turning {bd.ageTurning}
                    </p>
                  </div>
                  <button
                    onClick={() => handleGenerateMessage(bd.userId)}
                    disabled={generating === bd.userId}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {generating === bd.userId ? '...' : 'Draft'}
                  </button>
                </div>
                {generatedMessages[bd.userId] && (
                  <div className="mt-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                    <p className="text-xs text-gray-700 italic">{generatedMessages[bd.userId]}</p>
                    <div className="flex gap-2 mt-2">
                      <a
                        href={`/messages?to=${bd.userId}`}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Send →
                      </a>
                      <button
                        onClick={() => navigator.clipboard.writeText(generatedMessages[bd.userId])}
                        className="text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'notifications' && hasNotifications && (
          <div className="divide-y divide-gray-50">
            {notifications.slice(0, 10).map((notif) => (
              <div key={notif.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                    {notif.actionUrl && (
                      <a
                        href={notif.actionUrl}
                        className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {notif.actionLabel || 'View'}
                        <ChevronRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => handleDismissNotification(notif.id)}
                    className="text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
