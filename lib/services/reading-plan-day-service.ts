import { FieldValue } from 'firebase-admin/firestore'
import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export interface ReadingPlanDay {
  id: string
  planId: string
  dayNumber: number
  title: string
  summary?: string
  passageId: string
  bibleVersionId: string
  devotionalText?: string
  prayerFocus?: string
  resourceIds?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ReadingPlanResource {
  id: string
  planId?: string
  title: string
  description?: string
  type: 'book' | 'pdf' | 'audio' | 'video' | 'link'
  fileUrl?: string
  fileName?: string
  filePath?: string
  contentType?: string
  size?: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export class ReadingPlanDayService {
  private static getDocId(planId: string, dayNumber: number) {
    return `${planId}::${dayNumber}`
  }

  static async findByPlanAndDay(planId: string, dayNumber: number): Promise<ReadingPlanDay | null> {
    const docId = this.getDocId(planId, dayNumber)
    const doc = await db.collection(COLLECTIONS.readingPlanDays).doc(docId).get()
    if (!doc.exists) return null
    const data = doc.data()!
    return {
      id: doc.id,
      planId: data.planId,
      dayNumber: data.dayNumber,
      title: data.title,
      summary: data.summary,
      passageId: data.passageId,
      bibleVersionId: data.bibleVersionId,
      devotionalText: data.devotionalText,
      prayerFocus: data.prayerFocus,
      resourceIds: data.resourceIds || [],
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    }
  }

  static async upsert(data: {
    planId: string
    dayNumber: number
    title: string
    summary?: string
    passageId: string
    bibleVersionId: string
    devotionalText?: string
    prayerFocus?: string
    resourceIds?: string[]
  }): Promise<ReadingPlanDay> {
    const docId = this.getDocId(data.planId, data.dayNumber)
    const payload = {
      ...data,
      resourceIds: data.resourceIds || [],
      updatedAt: FieldValue.serverTimestamp(),
    }

    await db.collection(COLLECTIONS.readingPlanDays).doc(docId).set(
      {
        ...payload,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return this.findByPlanAndDay(data.planId, data.dayNumber) as Promise<ReadingPlanDay>
  }
}

export class ReadingPlanResourceService {
  static async create(data: Omit<ReadingPlanResource, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReadingPlanResource> {
    const payload = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.readingPlanResources).doc()
    await docRef.set(payload)
    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as ReadingPlanResource
  }

  static async findById(id: string): Promise<ReadingPlanResource | null> {
    const doc = await db.collection(COLLECTIONS.readingPlanResources).doc(id).get()
    if (!doc.exists) return null
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as ReadingPlanResource
  }

  static async findMany(ids: string[]): Promise<ReadingPlanResource[]> {
    if (!ids || ids.length === 0) return []
    const snapshots = await Promise.all(ids.map((id) => db.collection(COLLECTIONS.readingPlanResources).doc(id).get()))
    return snapshots
      .filter((doc) => doc.exists)
      .map((doc) => {
        const data = doc.data()!
        return {
          id: doc.id,
          ...data,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as ReadingPlanResource
      })
  }

  static async listByPlan(planId: string): Promise<ReadingPlanResource[]> {
    const snapshot = await db
      .collection(COLLECTIONS.readingPlanResources)
      .where('planId', '==', planId)
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as ReadingPlanResource
    })
  }
}
