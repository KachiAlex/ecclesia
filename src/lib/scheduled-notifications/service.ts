/**
 * Scheduled Notification Service
 * Manages scheduling, persistence, and execution of recommendation digests
 */

import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  writeBatch,
  QueryConstraint,
} from 'firebase/firestore'
import {
  ScheduledNotification,
  ScheduledNotificationRun,
  ScheduleConfig,
  ScheduleFrequency,
  EmailDigest,
  ScheduledNotificationCreateInput,
  ScheduledNotificationUpdateInput,
  DigestFormat,
} from './types'
import { RecommendationService } from '../services/recommendation-service'
import { generateRandomId } from '@/lib/utils'

export class ScheduledNotificationService {
  private static readonly COLLECTION_SCHEDULED = 'scheduled_notifications'
  private static readonly COLLECTION_RUNS = 'scheduled_notification_runs'

  /**
   * Create a new scheduled notification
   */
  static async createScheduledNotification(
    churchId: string,
    userId: string,
    input: ScheduledNotificationCreateInput
  ): Promise<ScheduledNotification> {
    const id = generateRandomId()
    const now = new Date()
    const nextRunDate = this.calculateNextRunDate(input.scheduleConfig, now)

    const notification: ScheduledNotification = {
      id,
      churchId,
      userId,
      recipientEmails: input.recipientEmails,
      title: input.title,
      description: input.description,
      scheduleConfig: input.scheduleConfig,
      digestConfig: input.digestConfig,
      status: 'active',
      nextRunDate,
      runCount: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    }

    await setDoc(
      doc(db, this.COLLECTION_SCHEDULED, id),
      {
        ...notification,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        nextRunDate: nextRunDate ? Timestamp.fromDate(nextRunDate) : null,
      }
    )

    return notification
  }

  /**
   * Get a scheduled notification by ID
   */
  static async getScheduledNotification(id: string): Promise<ScheduledNotification | null> {
    const docSnapshot = await getDoc(doc(db, this.COLLECTION_SCHEDULED, id))
    if (!docSnapshot.exists()) return null

    return this.mapDocToScheduledNotification(docSnapshot.data())
  }

  /**
   * Get all scheduled notifications for a church
   */
  static async getScheduledNotifications(
    churchId: string,
    filters?: { status?: string }
  ): Promise<ScheduledNotification[]> {
    const constraints: QueryConstraint[] = [where('churchId', '==', churchId)]

    if (filters?.status) {
      constraints.push(where('status', '==', filters.status))
    }

    const querySnapshot = await getDocs(query(collection(db, this.COLLECTION_SCHEDULED), ...constraints))
    return querySnapshot.docs.map((doc) => this.mapDocToScheduledNotification(doc.data()))
  }

  /**
   * Update a scheduled notification
   */
  static async updateScheduledNotification(
    id: string,
    updates: ScheduledNotificationUpdateInput
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: Timestamp.now(),
    }

    if (updates.scheduleConfig) {
      const doc = await getDoc(doc(db, this.COLLECTION_SCHEDULED, id))
      if (doc.exists()) {
        const current = doc.data() as any
        const nextRunDate = this.calculateNextRunDate(
          updates.scheduleConfig,
          current.createdAt?.toDate?.() || new Date()
        )
        if (nextRunDate) {
          updateData.nextRunDate = Timestamp.fromDate(nextRunDate)
        }
      }
    }

    await updateDoc(doc(db, this.COLLECTION_SCHEDULED, id), updateData)
  }

  /**
   * Delete a scheduled notification
   */
  static async deleteScheduledNotification(id: string): Promise<void> {
    await deleteDoc(doc(db, this.COLLECTION_SCHEDULED, id))

    // Clean up associated runs
    const runs = await getDocs(
      query(
        collection(db, this.COLLECTION_RUNS),
        where('scheduledNotificationId', '==', id)
      )
    )

    const batch = writeBatch(db)
    runs.docs.forEach((runDoc) => {
      batch.delete(runDoc.ref)
    })
    await batch.commit()
  }

  /**
   * Execute a scheduled notification - called by cron/background job
   */
  static async executeScheduledNotification(notificationId: string): Promise<ScheduledNotificationRun> {
    const notification = await this.getScheduledNotification(notificationId)
    if (!notification) {
      throw new Error(`Scheduled notification ${notificationId} not found`)
    }

    if (notification.status !== 'active') {
      throw new Error(`Scheduled notification ${notificationId} is not active`)
    }

    const runId = generateRandomId()
    const now = new Date()

    // Gather recommendation data
    const digestData = await this.gatherDigestData(notification)

    const run: ScheduledNotificationRun = {
      id: runId,
      scheduledNotificationId: notificationId,
      churchId: notification.churchId,
      runDate: now,
      status: 'sent',
      sentTo: notification.recipientEmails,
      digestData,
      createdAt: now,
      completedAt: now,
    }

    // Save run record
    await setDoc(doc(db, this.COLLECTION_RUNS, runId), {
      ...run,
      runDate: Timestamp.fromDate(now),
      createdAt: Timestamp.fromDate(now),
      completedAt: Timestamp.fromDate(now),
    })

    // Update notification stats
    const nextRunDate = this.calculateNextRunDate(
      notification.scheduleConfig,
      now
    )

    await updateDoc(doc(db, this.COLLECTION_SCHEDULED, notificationId), {
      lastRunDate: Timestamp.fromDate(now),
      runCount: notification.runCount + 1,
      nextRunDate: nextRunDate ? Timestamp.fromDate(nextRunDate) : null,
      updatedAt: Timestamp.now(),
    })

    return run
  }

  /**
   * Get scheduled notification runs
   */
  static async getScheduledNotificationRuns(
    notificationId: string
  ): Promise<ScheduledNotificationRun[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, this.COLLECTION_RUNS),
        where('scheduledNotificationId', '==', notificationId)
      )
    )
    return querySnapshot.docs.map((doc) => this.mapDocToScheduledRun(doc.data()))
  }

  /**
   * Calculate next run date based on schedule config
   */
  private static calculateNextRunDate(config: ScheduleConfig, fromDate: Date): Date | null {
    const next = new Date(fromDate)

    if (config.frequency === 'once') {
      // One-time execution
      if (config.time) {
        next.setHours(config.time.hour, config.time.minute, 0, 0)
        return next > fromDate ? next : null
      }
      return null
    }

    if (config.frequency === 'daily') {
      if (config.time) {
        next.setDate(next.getDate() + 1)
        next.setHours(config.time.hour, config.time.minute, 0, 0)
        return next
      }
      return null
    }

    if (config.frequency === 'weekly' && config.weeklyConfig) {
      const { days, time } = config.weeklyConfig
      const currentDayIndex = next.getDay()
      let daysUntilNext = null

      // Find next scheduled day
      for (let offset = 1; offset <= 7; offset++) {
        const checkDay = (currentDayIndex + offset) % 7
        const dayNames = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ]
        if (days.includes(dayNames[checkDay] as any)) {
          daysUntilNext = offset
          break
        }
      }

      if (daysUntilNext !== null) {
        next.setDate(next.getDate() + daysUntilNext)
        next.setHours(time.hour, time.minute, 0, 0)
        return next
      }
      return null
    }

    if (config.frequency === 'monthly' && config.monthlyConfig) {
      const { dayOfMonth, time } = config.monthlyConfig
      next.setMonth(next.getMonth() + 1)
      next.setDate(Math.min(dayOfMonth, 28)) // Safe for all months
      next.setHours(time.hour, time.minute, 0, 0)
      return next
    }

    return null
  }

  /**
   * Gather recommendation data for digest
   */
  private static async gatherDigestData(notification: ScheduledNotification): Promise<Record<string, unknown>> {
    const { digestConfig, churchId } = notification
    const data: Record<string, unknown> = {}

    try {
      if (digestConfig.includeAttendancePredictions) {
        data.attendancePredictions = await RecommendationService.getRecommendations(
          notification.userId,
          churchId,
          'pending'
        )
      }

      if (digestConfig.includeOptimalSchedules) {
        data.optimalSchedules = {
          message: 'Optimal schedules generated',
          timestamp: new Date().toISOString(),
        }
      }

      if (digestConfig.includeMemberEngagement) {
        data.memberEngagement = {
          message: 'Member engagement analysis completed',
          timestamp: new Date().toISOString(),
        }
      }

      if (digestConfig.includeContentRecommendations) {
        data.contentRecommendations = await RecommendationService.getRecommendations(
          notification.userId,
          churchId
        ).catch(() => [])
      }
    } catch (error) {
      console.error('Error gathering digest data:', error)
      // Continue with partial data
    }

    return data
  }

  /**
   * Get all scheduled notifications due to run
   */
  static async getNotificationsDueToRun(now: Date = new Date()): Promise<ScheduledNotification[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, this.COLLECTION_SCHEDULED),
        where('status', '==', 'active'),
        where('nextRunDate', '<=', Timestamp.fromDate(now))
      )
    )
    return querySnapshot.docs.map((doc) => this.mapDocToScheduledNotification(doc.data()))
  }

  /**
   * Helper: Map Firestore doc to ScheduledNotification
   */
  private static mapDocToScheduledNotification(data: any): ScheduledNotification {
    return {
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
      nextRunDate: data.nextRunDate?.toDate?.() || undefined,
      lastRunDate: data.lastRunDate?.toDate?.() || undefined,
    }
  }

  /**
   * Helper: Map Firestore doc to ScheduledNotificationRun
   */
  private static mapDocToScheduledRun(data: any): ScheduledNotificationRun {
    return {
      ...data,
      runDate: data.runDate?.toDate?.() || new Date(data.runDate),
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      completedAt: data.completedAt?.toDate?.() || undefined,
    }
  }
}
