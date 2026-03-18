// This file is server-only and should only be imported on the server
import 'server-only'

/**
 * Real-time Events Emitted by Server
 */
export enum RealtimeEvent {
  // Messages
  MESSAGE_SENT = 'message:sent',
  MESSAGE_DELETED = 'message:deleted',
  MESSAGE_EDITED = 'message:edited',

  // Notifications
  NOTIFICATION_SENT = 'notification:sent',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_CLEARED = 'notification:cleared',

  // Presence
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
  USER_TYPING = 'user:typing',
  USER_STOPPED_TYPING = 'user:stopped_typing',

  // Meeting/Livestream Events
  MEETING_STARTED = 'meeting:started',
  MEETING_ENDED = 'meeting:ended',
  MEETING_UPDATED = 'meeting:updated',
  LIVESTREAM_STARTED = 'livestream:started',
  LIVESTREAM_ENDED = 'livestream:ended',
  LIVESTREAM_VIEWER_COUNT = 'livestream:viewer_count',

  // Attendance
  ATTENDANCE_MARKED = 'attendance:marked',
  ATTENDANCE_UPDATED = 'attendance:updated',

  // General
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
}

export type ServerInstance = any

/**
 * Real-time Server Manager - Lazy initialized
 */
let socketIOInstance: ServerInstance | null = null

export class RealtimeServer {
  private static userSockets: Map<string, Set<string>> = new Map()
  private static userPresence: Map<string, any> = new Map()

  /**
   * Initialize Socket.io server (lazy loaded)
   */
  static async initialize(httpServer: any): Promise<ServerInstance> {
    if (socketIOInstance) {
      return socketIOInstance
    }

    try {
      // @ts-ignore - socket.io is server-only
      const { Server } = await import('socket.io')

      socketIOInstance = new Server(httpServer, {
        cors: {
          origin: process.env.NEXTAUTH_URL?.replace(/:\d+$/, '') || '*',
          methods: ['GET', 'POST'],
          credentials: true,
        },
        transports: ['websocket', 'polling'],
        maxHttpBufferSize: 1e6,
      })

      // Middleware
      socketIOInstance.use(async (socket: any, next: any) => {
        try {
          const token = socket.handshake.auth.token
          if (!token) {
            return next(new Error('Authentication error'))
          }

          socket.data.userId = socket.handshake.query.userId
          socket.data.churchId = socket.handshake.query.churchId
          next()
        } catch (error) {
          next(new Error('Authentication failed'))
        }
      })

      // Connection handler
      socketIOInstance.on('connect', (socket: any) => {
        const userId = socket.data.userId
        const churchId = socket.data.churchId

        if (!userId || !churchId) {
          socket.disconnect()
          return
        }

        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set())
        }
        this.userSockets.get(userId)!.add(socket.id)

        this.userPresence.set(socket.id, {
          userId,
          churchId,
          socketId: socket.id,
          connectedAt: new Date(),
          status: 'online',
        })

        socket.join(`church:${churchId}`)
        socket.join(`user:${userId}`)

        socketIOInstance?.to(`church:${churchId}`).emit(RealtimeEvent.USER_ONLINE, {
          userId,
          timestamp: new Date(),
        })

        socket.on('disconnect', () => {
          const sockets = this.userSockets.get(userId)
          if (sockets) {
            sockets.delete(socket.id)
            if (sockets.size === 0) {
              this.userSockets.delete(userId)
              socketIOInstance?.to(`church:${churchId}`).emit(RealtimeEvent.USER_OFFLINE, {
                userId,
                timestamp: new Date(),
              })
            }
          }
          this.userPresence.delete(socket.id)
        })
      })

      return socketIOInstance
    } catch (error) {
      console.error('Failed to initialize Socket.io:', error)
      throw error
    }
  }

  static getInstance(): ServerInstance | null {
    return socketIOInstance
  }

  static broadcastToChurch(churchId: string, event: string, data: any): void {
    if (socketIOInstance) {
      socketIOInstance.to(`church:${churchId}`).emit(event, {
        ...data,
        timestamp: new Date(),
      })
    }
  }

  static sendToUser(userId: string, event: string, data: any): void {
    if (socketIOInstance) {
      socketIOInstance.to(`user:${userId}`).emit(event, {
        ...data,
        timestamp: new Date(),
      })
    }
  }

  static getOnlineUsers(churchId: string): string[] {
    const onlineUsers = new Set<string>()
    this.userPresence.forEach(presence => {
      if (presence.churchId === churchId && presence.status !== 'offline') {
        onlineUsers.add(presence.userId)
      }
    })
    return Array.from(onlineUsers)
  }
}
