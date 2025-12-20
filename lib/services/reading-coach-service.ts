import { FieldValue } from 'firebase-admin/firestore'
import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export interface ReadingCoachSession {
  id: string
  userId: string
  planId?: string
  dayNumber?: number
  question: string
  answer: string
  actionStep?: string
  encouragement?: string
  scriptures?: string[]
  followUpQuestion?: string
  metadata?: Record<string, any>
  createdAt: Date
}

export interface ReadingCoachSessionCreateInput
  extends Omit<ReadingCoachSession, 'id' | 'createdAt'> {}

export class ReadingCoachSessionService {
  static async create(data: ReadingCoachSessionCreateInput): Promise<ReadingCoachSession> {
    const payload = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.readingCoachSessions).doc()
    await docRef.set(payload)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: docRef.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
    } as ReadingCoachSession
  }

  static async findByUser(userId: string, limit: number = 10): Promise<ReadingCoachSession[]> {
    const snapshot = await db
      .collection(COLLECTIONS.readingCoachSessions)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
      } as ReadingCoachSession
    })
  }

  static async findRecentForPlan(userId: string, planId: string, limit: number = 5): Promise<ReadingCoachSession[]> {
    const snapshot = await db
      .collection(COLLECTIONS.readingCoachSessions)
      .where('userId', '==', userId)
      .where('planId', '==', planId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
      } as ReadingCoachSession
    })
  }
}

export interface ReadingCoachNudge {
  id: string
  userId: string
  planId?: string
  type: 'progress' | 'reminder' | 'celebration' | 'insight'
  message: string
  status: 'pending' | 'sent' | 'dismissed'
  scheduledAt?: Date
  metadata?: Record<string, any>
  createdAt: Date
}

export interface ReadingCoachNudgeCreateInput
  extends Omit<ReadingCoachNudge, 'id' | 'createdAt'> {}

export class ReadingCoachNudgeService {
  static async create(data: ReadingCoachNudgeCreateInput): Promise<ReadingCoachNudge> {
    const payload = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.readingCoachNudges).doc()
    await docRef.set(payload)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: docRef.id,
      ...createdData,
      scheduledAt: createdData.scheduledAt ? toDate(createdData.scheduledAt) : undefined,
      createdAt: toDate(createdData.createdAt),
    } as ReadingCoachNudge
  }

  static async listPending(userId: string): Promise<ReadingCoachNudge[]> {
    const snapshot = await db
      .collection(COLLECTIONS.readingCoachNudges)
      .where('userId', '==', userId)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        scheduledAt: data.scheduledAt ? toDate(data.scheduledAt) : undefined,
        createdAt: toDate(data.createdAt),
      } as ReadingCoachNudge
    })
  }

  static async findById(id: string): Promise<ReadingCoachNudge | null> {
    const doc = await db.collection(COLLECTIONS.readingCoachNudges).doc(id).get()
    if (!doc.exists) return null
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      scheduledAt: data.scheduledAt ? toDate(data.scheduledAt) : undefined,
      createdAt: toDate(data.createdAt),
    } as ReadingCoachNudge
  }

  static async updateStatus(id: string, status: ReadingCoachNudge['status']): Promise<void> {
    await db.collection(COLLECTIONS.readingCoachNudges).doc(id).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
}
