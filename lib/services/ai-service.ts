import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export interface AICoachingSession {
  id: string
  userId: string
  question: string
  answer: string
  topic?: string
  createdAt: Date
}

export interface FollowUp {
  id: string
  userId: string
  type: string
  message: string
  scripture?: string
  createdAt: Date
}

export class AICoachingSessionService {
  static async findByUser(userId: string, limit: number = 5): Promise<AICoachingSession[]> {
    const snapshot = await db.collection(COLLECTIONS.aiCoachingSessions)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
      } as AICoachingSession
    })
  }

  static async create(data: Omit<AICoachingSession, 'id' | 'createdAt'>): Promise<AICoachingSession> {
    const sessionData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.aiCoachingSessions).doc()
    await docRef.set(sessionData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
    } as AICoachingSession
  }
}

export class FollowUpService {
  static async create(data: Omit<FollowUp, 'id' | 'createdAt'>): Promise<FollowUp> {
    const followUpData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.followUps).doc()
    await docRef.set(followUpData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
    } as FollowUp
  }
}

