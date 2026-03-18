import { db, FieldValue } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { RealtimeServer } from '@/lib/realtime/server'

export interface NotificationPayload {
  userId: string
  churchId: string
  title: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REMINDER'
  link?: string
  icon?: string
  actionUrl?: string
  metadata?: Record<string, any>
}

/**
 * Notification Service
 * Handles real-time and persistent notifications
 */
export class NotificationService {
  /**
   * Send notification to user
   */
  static async sendNotification(payload: NotificationPayload): Promise<string> {
    const notificationId = db.collection(COLLECTIONS.notifications).doc().id

    // Save notification to database
    await db.collection(COLLECTIONS.notifications).doc(notificationId).set({
      userId: payload.userId,
      churchId: payload.churchId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      link: payload.link,
      icon: payload.icon,
      actionUrl: payload.actionUrl,
      metadata: payload.metadata || {},
      read: false,
      deleted: false,
      createdAt: FieldValue.serverTimestamp(),
      readAt: null,
    })

    // Emit real-time notification
    RealtimeServer.sendToUser(payload.userId, 'notification:sent', {
      id: notificationId,
      ...payload,
      createdAt: new Date(),
    })

    return notificationId
  }

  /**
   * Send notification to multiple users
   */
  static async sendNotificationToMany(
    userIds: string[],
    churchId: string,
    payload: Omit<NotificationPayload, 'userId' | 'churchId'>
  ): Promise<string[]> {
    const notificationIds = []

    for (const userId of userIds) {
      const id = await this.sendNotification({
        ...payload,
        userId,
        churchId,
      })
      notificationIds.push(id)
    }

    return notificationIds
  }

  /**
   * Send notification to all church members
   */
  static async broadcastToChurch(
    churchId: string,
    payload: Omit<NotificationPayload, 'churchId' | 'userId'>
  ): Promise<void> {
    // Get all users in church
    const usersSnapshot = await db
      .collection(COLLECTIONS.users)
      .where('churchId', '==', churchId)
      .get()

    const userIds = usersSnapshot.docs.map(doc => doc.id)

    await this.sendNotificationToMany(userIds, churchId, payload)

    // Also broadcast to connected users in real-time
    RealtimeServer.broadcastToChurch(churchId, 'notification:sent', payload)
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    await db.collection(COLLECTIONS.notifications).doc(notificationId).update({
      read: true,
      readAt: FieldValue.serverTimestamp(),
    })
  }

  /**
   * Mark multiple notifications as read
   */
  static async markManyAsRead(notificationIds: string[]): Promise<void> {
    const batch = db.batch()

    for (const id of notificationIds) {
      batch.update(db.collection(COLLECTIONS.notifications).doc(id), {
        read: true,
        readAt: FieldValue.serverTimestamp(),
      })
    }

    await batch.commit()
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    await db.collection(COLLECTIONS.notifications).doc(notificationId).update({
      deleted: true,
      deletedAt: FieldValue.serverTimestamp(),
    })
  }

  /**
   * Clear all notifications for user
   */
  static async clearAllNotifications(userId: string): Promise<void> {
    const snapshot = await db
      .collection(COLLECTIONS.notifications)
      .where('userId', '==', userId)
      .where('deleted', '==', false)
      .get()

    const batch = db.batch()

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        deleted: true,
        deletedAt: FieldValue.serverTimestamp(),
      })
    })

    await batch.commit()
  }

  /**
   * Get unread notifications for user
   */
  static async getUnreadNotifications(userId: string): Promise<any[]> {
    const snapshot = await db
      .collection(COLLECTIONS.notifications)
      .where('userId', '==', userId)
      .where('read', '==', false)
      .where('deleted', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  }

  /**
   * Get recent notifications for user
   */
  static async getRecentNotifications(userId: string, limit: number = 20): Promise<any[]> {
    const snapshot = await db
      .collection(COLLECTIONS.notifications)
      .where('userId', '==', userId)
      .where('deleted', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      readAt: doc.data().readAt?.toDate?.() || null,
    }))
  }

  /**
   * Send meeting notification
   */
  static async notifyMeetingStart(
    churchId: string,
    meetingTitle: string,
    meetUrl: string,
    userIds: string[]
  ): Promise<void> {
    await this.sendNotificationToMany(userIds, churchId, {
      title: 'Meeting Starting',
      message: `${meetingTitle} is starting now`,
      type: 'REMINDER',
      icon: 'video',
      actionUrl: meetUrl,
      metadata: {
        meetingTitle,
        meetUrl,
      },
    })
  }

  /**
   * Send livestream notification
   */
  static async notifyLivestreamStart(
    churchId: string,
    livestreamTitle: string,
    streamUrl: string,
    userIds?: string[]
  ): Promise<void> {
    if (userIds && userIds.length > 0) {
      await this.sendNotificationToMany(userIds, churchId, {
        title: 'Livestream Starting',
        message: `${livestreamTitle} is now live`,
        type: 'INFO',
        icon: 'broadcast',
        actionUrl: streamUrl,
        metadata: {
          livestreamTitle,
          streamUrl,
        },
      })
    } else {
      // Broadcast to all church members
      await this.broadcastToChurch(churchId, {
        title: 'Livestream Starting',
        message: `${livestreamTitle} is now live`,
        type: 'INFO',
        icon: 'broadcast',
        actionUrl: streamUrl,
        metadata: {
          livestreamTitle,
          streamUrl,
        },
      })
    }
  }

  /**
   * Send attendance reminder
   */
  static async notifyAttendanceReminder(
    churchId: string,
    meetingTitle: string,
    startTime: Date,
    userIds: string[]
  ): Promise<void> {
    const timeUntil = Math.round((startTime.getTime() - Date.now()) / 60000)
    const timeText = timeUntil < 60 ? `${timeUntil} minutes` : `${Math.round(timeUntil / 60)} hours`

    await this.sendNotificationToMany(userIds, churchId, {
      title: 'Upcoming Meeting',
      message: `${meetingTitle} starts in ${timeText}`,
      type: 'REMINDER',
      icon: 'calendar',
      metadata: {
        meetingTitle,
        startTime: startTime.toISOString(),
      },
    })
  }
}
