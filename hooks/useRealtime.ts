'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'

/**
 * Socket.io Client Hook
 * Manages real-time connection and event handling
 */
export function useRealtime() {
  const { data: session } = useSession()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  // Get church context
  const { data: church } = useQuery({
    queryKey: ['current-church'],
    queryFn: async () => {
      const res = await fetch('/api/churches/current')
      return res.json()
    },
  })

  /**
   * Initialize Socket.io connection
   */
  useEffect(() => {
    if (!session?.user || !church?.id) return

    const socket = io(process.env.NEXT_PUBLIC_API_URL || window.location.origin, {
      auth: {
        token: session?.user,
      },
      query: {
        churchId: church.id,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      console.log('[Realtime] Connected to server')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('[Realtime] Disconnected from server')
      setIsConnected(false)
    })

    socket.on('user:online', (data: any) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev)
        updated.add(data.userId)
        return Array.from(updated)
      })
    })

    socket.on('user:offline', (data: any) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId))
    })

    socket.on('error', (error: any) => {
      console.error('[Realtime] Error:', error)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [session?.user, church?.id])

  /**
   * Listen to event
   */
  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }, [])

  /**
   * Emit event
   */
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    }
  }, [])

  /**
   * Off event listener
   */
  const off = useCallback((event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback)
    }
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    on,
    emit,
    off,
  }
}

/**
 * Hook for listening to messages in real-time
 */
export function useRealtimeMessages(channelId: string) {
  const { on, off } = useRealtime()
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    const handleNewMessage = (message: any) => {
      if (message.channelId === channelId) {
        setMessages(prev => [...prev, message])
      }
    }

    on('message:sent', handleNewMessage)

    return () => {
      off('message:sent', handleNewMessage)
    }
  }, [channelId, on, off])

  return messages
}

/**
 * Hook for listening to notifications in real-time
 */
export function useRealtimeNotifications() {
  const { on, off } = useRealtime()
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    const handleNotification = (notification: any) => {
      setNotifications(prev => [...prev, notification])
    }

    on('notification:sent', handleNotification)

    return () => {
      off('notification:sent', handleNotification)
    }
  }, [on, off])

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }, [])

  return {
    notifications,
    clearNotification,
  }
}

/**
 * Hook for tracking user typing status
 */
export function useRealtimeTyping(channelId: string) {
  const { on, off, emit } = useRealtime()
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const handleUserTyping = (data: any) => {
      if (data.channelId === channelId) {
        setTypingUsers(prev => new Set([...prev, data.userId]))

        // Clear typing status after 3 seconds of inactivity
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }

        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers(prev => {
            const updated = new Set(prev)
            updated.delete(data.userId)
            return updated
          })
        }, 3000)
      }
    }

    const handleUserStoppedTyping = (data: any) => {
      if (data.channelId === channelId) {
        setTypingUsers(prev => {
          const updated = new Set(prev)
          updated.delete(data.userId)
          return updated
        })
      }
    }

    on('user:typing', handleUserTyping)
    on('user:stopped_typing', handleUserStoppedTyping)

    return () => {
      off('user:typing', handleUserTyping)
      off('user:stopped_typing', handleUserStoppedTyping)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [channelId, on, off])

  const notifyTyping = useCallback(() => {
    emit('user:typing', { channelId })
  }, [emit, channelId])

  const notifyStoppedTyping = useCallback(() => {
    emit('user:stopped_typing', { channelId })
  }, [emit, channelId])

  return {
    typingUsers: Array.from(typingUsers),
    notifyTyping,
    notifyStoppedTyping,
  }
}

/**
 * Hook for listening to presence updates
 */
export function useRealtimePresence() {
  const { on, off, emit } = useRealtime()
  const [userPresence, setUserPresence] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    const handlePresenceUpdate = (data: any) => {
      setUserPresence(prev => new Map([...prev, [data.userId, data.status]]))
    }

    on('presence:updated', handlePresenceUpdate)

    return () => {
      off('presence:updated', handlePresenceUpdate)
    }
  }, [on, off])

  const updateStatus = useCallback((status: 'online' | 'away' | 'offline') => {
    emit('presence:update', { status })
  }, [emit])

  return {
    userPresence,
    updateStatus,
  }
}
