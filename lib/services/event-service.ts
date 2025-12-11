import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { Query } from 'firebase-admin/firestore'
import { FieldValue } from 'firebase-admin/firestore'

export interface Event {
  id: string
  churchId: string
  groupId?: string
  title: string
  description?: string
  type: string
  location?: string
  startDate: Date
  endDate?: Date
  maxAttendees?: number
  isTicketed: boolean
  ticketPrice?: number
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}

export class EventService {
  static async findById(id: string): Promise<Event | null> {
    const doc = await db.collection(COLLECTIONS.events).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      startDate: toDate(data.startDate),
      endDate: data.endDate ? toDate(data.endDate) : undefined,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Event
  }

  static async create(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    const eventData = {
      ...data,
      startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
      endDate: data.endDate ? (data.endDate instanceof Date ? data.endDate : new Date(data.endDate)) : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.events).doc()
    await docRef.set(eventData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      startDate: toDate(createdData.startDate),
      endDate: createdData.endDate ? toDate(createdData.endDate) : undefined,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as Event
  }

  static async findByChurch(
    churchId: string,
    options?: {
      startDate?: Date
      endDate?: Date
      type?: string
      groupId?: string
      limit?: number
    }
  ): Promise<Event[]> {
    let query: Query = db.collection(COLLECTIONS.events)
      .where('churchId', '==', churchId)

    if (options?.type) {
      query = query.where('type', '==', options.type)
    }

    if (options?.groupId) {
      query = query.where('groupId', '==', options.groupId)
    }

    if (options?.startDate) {
      query = query.where('startDate', '>=', options.startDate)
    }

    query = query.orderBy('startDate', 'asc').limit(options?.limit || 50)

    const snapshot = await query.get()
    let events = snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        startDate: toDate(data.startDate),
        endDate: data.endDate ? toDate(data.endDate) : undefined,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Event
    })

    // Filter by endDate if provided (Firestore query limitation)
    if (options?.endDate) {
      events = events.filter((event: any) =>
        !event.endDate || event.endDate <= options.endDate!
      )
    }

    return events
  }

  static async update(id: string, data: Partial<Event>): Promise<Event> {
    const updateData: any = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (data.startDate) {
      updateData.startDate = data.startDate instanceof Date ? data.startDate : new Date(data.startDate)
    }
    if (data.endDate) {
      updateData.endDate = data.endDate instanceof Date ? data.endDate : new Date(data.endDate)
    }

    delete updateData.id
    delete updateData.createdAt
    delete updateData.updatedAt

    await db.collection(COLLECTIONS.events).doc(id).update(updateData)
    return this.findById(id) as Promise<Event>
  }
}

