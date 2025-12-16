import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue, Query } from 'firebase-admin/firestore'

export interface PrayerRequest {
  id: string
  userId: string
  churchId: string
  title: string
  content: string
  status: string
  isAnonymous: boolean
  prayerCount: number
  createdAt: Date
  updatedAt: Date
}

export class PrayerRequestService {
  static async findById(id: string): Promise<PrayerRequest | null> {
    const doc = await db.collection(COLLECTIONS.prayerRequests).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      prayerCount: data.prayerCount || 0,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as PrayerRequest
  }

  static async create(data: Omit<PrayerRequest, 'id' | 'createdAt' | 'updatedAt' | 'prayerCount'>): Promise<PrayerRequest> {
    const prayerData = {
      ...data,
      prayerCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.prayerRequests).doc()
    await docRef.set(prayerData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as PrayerRequest
  }

  static async findByChurch(
    churchId: string,
    options?: {
      status?: string
      limit?: number
      lastDocId?: string
    }
  ): Promise<PrayerRequest[]> {
    let query: Query = db.collection(COLLECTIONS.prayerRequests)
      .where('churchId', '==', churchId)
      .limit(options?.limit || 20)

    // Only filter by status if specified
    if (options?.status) {
      query = query.where('status', '==', options.status)
    }

    // Note: orderBy removed temporarily to avoid composite index requirement
    // Once Firestore indexes are created, we can add back:
    // query = query.orderBy('createdAt', 'desc')

    if (options?.lastDocId) {
      const lastDoc = await db.collection(COLLECTIONS.prayerRequests).doc(options.lastDocId).get()
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc)
      }
    }

    const snapshot = await query.get()
    const results = snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        prayerCount: data.prayerCount || 0,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as PrayerRequest
    })

    // Sort in memory since we can't use orderBy without indexes
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  static async incrementPrayerCount(id: string): Promise<void> {
    await db.collection(COLLECTIONS.prayerRequests).doc(id).update({
      prayerCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  static async updateStatus(id: string, status: string): Promise<PrayerRequest> {
    await db.collection(COLLECTIONS.prayerRequests).doc(id).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return this.findById(id) as Promise<PrayerRequest>
  }
}

export interface PrayerInteraction {
  id: string
  userId: string
  requestId: string
  type: string
  comment?: string
  createdAt: Date
}

export class PrayerInteractionService {
  static async findByUserAndRequest(userId: string, requestId: string): Promise<PrayerInteraction | null> {
    const snapshot = await db.collection(COLLECTIONS.prayerInteractions)
      .where('userId', '==', userId)
      .where('requestId', '==', requestId)
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
    } as PrayerInteraction
  }

  static async create(data: Omit<PrayerInteraction, 'id' | 'createdAt'>): Promise<PrayerInteraction> {
    const interactionData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.prayerInteractions).doc()
    await docRef.set(interactionData)

    // Increment prayer count on request
    await PrayerRequestService.incrementPrayerCount(data.requestId)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
    } as PrayerInteraction
  }

  static async update(id: string, comment?: string): Promise<PrayerInteraction> {
    await db.collection(COLLECTIONS.prayerInteractions).doc(id).update({
      comment: comment || null,
    })
    const doc = await db.collection(COLLECTIONS.prayerInteractions).doc(id).get()
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
    } as PrayerInteraction
  }
}

