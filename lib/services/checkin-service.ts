import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { Query } from 'firebase-admin/firestore'
import { FieldValue } from 'firebase-admin/firestore'

export interface CheckIn {
  id: string
  userId: string
  eventId?: string
  checkedInAt: Date
  location?: string
  qrCode?: string
  createdAt: Date
}

export class CheckInService {
  static async findByUser(userId: string, limit?: number): Promise<CheckIn[]> {
    let query = db.collection(COLLECTIONS.checkIns)
      .where('userId', '==', userId)
      .orderBy('checkedInAt', 'desc')
    
    if (limit) {
      query = query.limit(limit) as Query
    }

    const snapshot = await query.get()
    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        checkedInAt: toDate(data.checkedInAt),
        createdAt: toDate(data.createdAt),
      } as CheckIn
    })
  }

  static async findByEvent(eventId: string): Promise<CheckIn[]> {
    const snapshot = await db.collection(COLLECTIONS.checkIns)
      .where('eventId', '==', eventId)
      .orderBy('checkedInAt', 'desc')
      .get()

    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        checkedInAt: toDate(data.checkedInAt),
        createdAt: toDate(data.createdAt),
      } as CheckIn
    })
  }

  static async countByChurch(churchId: string, startDate?: Date): Promise<number> {
    // Get all users in church
    const usersSnapshot = await db.collection(COLLECTIONS.users)
      .where('churchId', '==', churchId)
      .select()
      .get()

    const userIds = usersSnapshot.docs.map((doc: any) => doc.id)

    if (userIds.length === 0) return 0

    // Count check-ins for these users
    let count = 0
    for (const userId of userIds) {
      let query: Query = db.collection(COLLECTIONS.checkIns)
        .where('userId', '==', userId)
      
      if (startDate) {
        query = query.where('checkedInAt', '>=', startDate)
      }

      const snapshot = await query.count().get()
      count += snapshot.data().count || 0
    }

    return count
  }

  static async create(data: Omit<CheckIn, 'id' | 'createdAt'>): Promise<CheckIn> {
    const checkInData = {
      ...data,
      checkedInAt: data.checkedInAt instanceof Date ? data.checkedInAt : new Date(data.checkedInAt),
      createdAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.checkIns).doc()
    await docRef.set(checkInData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      checkedInAt: toDate(createdData.checkedInAt),
      createdAt: toDate(createdData.createdAt),
    } as CheckIn
  }
}

