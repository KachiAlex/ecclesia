'use server'

import { FieldValue } from 'firebase-admin/firestore'
import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { Event, EventService } from '@/lib/services/event-service'
import { EventRegistrationService } from '@/lib/services/event-registration-service'
import { MessageService } from '@/lib/services/message-service'

export type EventReminderStatus = 'scheduled' | 'sent' | 'cancelled'

export interface EventReminder {
  id: string
  eventId: string
  churchId: string
  notifyAt: Date
  message: string
  status: EventReminderStatus
  frequencyMinutes: number
  durationMinutes: number
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface ReminderConfig {
  durationHours: number
  frequencyMinutes: number
  message?: string
  createdBy?: string
}

export class EventReminderService {
  static async create(
    data: Omit<EventReminder, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<EventReminder> {
    const payload = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.eventReminders).doc()
    await docRef.set(payload)

    const snapshot = await docRef.get()
    const saved = snapshot.data()!

    return {
      id: docRef.id,
      ...saved,
      notifyAt: toDate(saved.notifyAt),
      createdAt: toDate(saved.createdAt),
      updatedAt: toDate(saved.updatedAt),
    } as EventReminder
  }

  static async scheduleForEvent(
    event: Event,
    config: ReminderConfig & { churchId: string }
  ): Promise<EventReminder[]> {
    const reminders: EventReminder[] = []
    const frequencyMinutes = Math.max(5, Math.floor(config.frequencyMinutes))
    const durationMinutes = Math.max(5, Math.floor(config.durationHours * 60))

    if (durationMinutes <= 0) {
      return reminders
    }

    const eventStart = event.startDate instanceof Date ? event.startDate : new Date(event.startDate)
    const now = new Date()
    let cursor = new Date(eventStart.getTime() - durationMinutes * 60 * 1000)

    if (cursor < now) {
      cursor = now
    }

    const message =
      config.message ||
      `Reminder: ${event.title} starts at ${eventStart.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })} on ${eventStart.toLocaleDateString()}`

    const payloads: Omit<EventReminder, 'id' | 'createdAt' | 'updatedAt'>[] = []

    while (cursor <= eventStart) {
      payloads.push({
        eventId: event.id,
        churchId: config.churchId,
        notifyAt: new Date(cursor),
        message,
        status: 'scheduled',
        frequencyMinutes,
        durationMinutes,
        createdBy: config.createdBy,
      } as EventReminder)

      if (cursor.getTime() === eventStart.getTime()) {
        break
      }

      cursor = new Date(cursor.getTime() + frequencyMinutes * 60 * 1000)

      if (cursor > eventStart) {
        cursor = new Date(eventStart)
      }
    }

    for (const payload of payloads) {
      const reminder = await this.create(payload)
      reminders.push(reminder)
    }

    return reminders
  }

  static async listDue(limit: number = 25): Promise<EventReminder[]> {
    const snapshot = await db
      .collection(COLLECTIONS.eventReminders)
      .where('status', '==', 'scheduled')
      .limit(limit * 2)
      .get()

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        notifyAt: toDate(data.notifyAt),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as EventReminder
    })
  }

  static async markSent(id: string): Promise<void> {
    await db.collection(COLLECTIONS.eventReminders).doc(id).update({
      status: 'sent',
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  static async clearScheduledForEvent(eventId: string): Promise<void> {
    const snapshot = await db
      .collection(COLLECTIONS.eventReminders)
      .where('eventId', '==', eventId)
      .where('status', '==', 'scheduled')
      .get()

    if (snapshot.empty) return

    const batch = db.batch()
    snapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()
  }

  static async sendDueReminders(limit: number = 25) {
    const now = new Date()
    const reminders = await this.listDue(limit)
    const dueReminders = reminders.filter((reminder) => reminder.notifyAt <= now)

    if (!dueReminders.length) {
      return { processed: 0, recipientsNotified: 0 }
    }

    let recipientsNotified = 0

    for (const reminder of dueReminders) {
      const event = await EventService.findById(reminder.eventId)
      if (!event) {
        await this.markSent(reminder.id)
        continue
      }

      const registrations = await EventRegistrationService.listByEvent(reminder.eventId)
      if (!registrations.length) {
        await this.markSent(reminder.id)
        continue
      }

      await Promise.all(
        registrations.map((registration) =>
          MessageService.create({
            senderId: reminder.createdBy || registration.userId,
            receiverId: registration.userId,
            content: reminder.message,
          })
        )
      )

      recipientsNotified += registrations.length
      await this.markSent(reminder.id)
    }

    return {
      processed: dueReminders.length,
      recipientsNotified,
    }
  }
}
