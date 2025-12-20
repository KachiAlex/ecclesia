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
  planIds?: string[]
  title: string
  description?: string
  author?: string
  categoryId?: string
  tags?: string[]
  type: 'book' | 'pdf' | 'audio' | 'video' | 'link'
  fileUrl?: string
  fileName?: string
  filePath?: string
  contentType?: string
  size?: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>
}

export interface ReadingResourceCategory {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
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

  static async update(
    id: string,
    data: Partial<Omit<ReadingPlanResource, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<ReadingPlanResource | null> {
    await db
      .collection(COLLECTIONS.readingPlanResources)
      .doc(id)
      .set(
        {
          ...data,
          tags: data.tags ?? FieldValue.delete(),
          planIds: data.planIds ?? FieldValue.delete(),
          metadata: data.metadata ?? FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

    return ReadingPlanResourceService.findById(id)
  }

  static async delete(id: string): Promise<void> {
    await db.collection(COLLECTIONS.readingPlanResources).doc(id).delete()
  }
}

export class ReadingResourceCategoryService {
  static async findById(id: string): Promise<ReadingResourceCategory | null> {
    const doc = await db.collection(COLLECTIONS.readingResourceCategories).doc(id).get()
    if (!doc.exists) return null
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as ReadingResourceCategory
  }

  static async listAll(): Promise<ReadingResourceCategory[]> {
    const snapshot = await db
      .collection(COLLECTIONS.readingResourceCategories)
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as ReadingResourceCategory
    })
  }

  static async create(data: Omit<ReadingResourceCategory, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = db.collection(COLLECTIONS.readingResourceCategories).doc()
    await docRef.set({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as ReadingResourceCategory
  }

  static async update(
    id: string,
    data: Partial<Omit<ReadingResourceCategory, 'id' | 'createdAt' | 'updatedAt'>>
  ) {
    await db
      .collection(COLLECTIONS.readingResourceCategories)
      .doc(id)
      .set(
        {
          ...data,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    const updated = await db.collection(COLLECTIONS.readingResourceCategories).doc(id).get()
    if (!updated.exists) return null
    const updatedData = updated.data()!
    return {
      id,
      ...updatedData,
      createdAt: toDate(updatedData.createdAt),
      updatedAt: toDate(updatedData.updatedAt),
    } as ReadingResourceCategory
  }

  static async delete(id: string) {
    await db.collection(COLLECTIONS.readingResourceCategories).doc(id).delete()
  }
}

export class ReadingPlanResourceService {
  static async create(
    data: Omit<ReadingPlanResource, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ReadingPlanResource> {
    const payload = {
      ...data,
      planIds: data.planIds || (data.planId ? [data.planId] : []),
      tags: data.tags || [],
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

  static async listAll(options: {
    categoryId?: string
    search?: string
    limit?: number
    cursor?: string
  } = {}): Promise<{ resources: ReadingPlanResource[]; nextCursor: string | null }> {
    let query: FirebaseFirestore.Query = db
      .collection(COLLECTIONS.readingPlanResources)
      .orderBy('createdAt', 'desc')
      .limit(options.limit || 20)

    if (options.categoryId) {
      query = query.where('categoryId', '==', options.categoryId)
    }

    if (options.cursor) {
      const cursorDoc = await db.collection(COLLECTIONS.readingPlanResources).doc(options.cursor).get()
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc)
      }
    }

    const snapshot = await query.get()
    let docs = snapshot.docs

    if (options.search) {
      const searchLower = options.search.toLowerCase()
      docs = docs.filter((doc) => {
        const data = doc.data()
        return (
          data.title?.toLowerCase().includes(searchLower) ||
          data.description?.toLowerCase().includes(searchLower) ||
          data.author?.toLowerCase().includes(searchLower)
        )
      })
    }

    const resources = docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as ReadingPlanResource
    })

    const nextCursor = snapshot.docs.length === (options.limit || 20) ? snapshot.docs[snapshot.docs.length - 1].id : null
    return { resources, nextCursor }
  }

  static async update(
    id: string,
    data: Partial<Omit<ReadingPlanResource, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<ReadingPlanResource | null> {
    await db
      .collection(COLLECTIONS.readingPlanResources)
      .doc(id)
      .set(
        {
          ...data,
          tags: data.tags ?? FieldValue.delete(),
          planIds: data.planIds ?? FieldValue.delete(),
          metadata: data.metadata ?? FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

    return this.findById(id)
  }

  static async delete(id: string): Promise<void> {
    await db.collection(COLLECTIONS.readingPlanResources).doc(id).delete()
  }
}
