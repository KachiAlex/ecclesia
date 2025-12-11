import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { Query } from 'firebase-admin/firestore'
import { FieldValue } from 'firebase-admin/firestore'

export interface Sermon {
  id: string
  churchId: string
  title: string
  description?: string
  speaker: string
  videoUrl?: string
  audioUrl?: string
  thumbnailUrl?: string
  duration?: number
  category?: string
  tags: string[]
  topics: string[]
  aiSummary?: string
  publishedAt: Date
  createdAt: Date
  updatedAt: Date
}

export class SermonService {
  static async findById(id: string): Promise<Sermon | null> {
    const doc = await db.collection(COLLECTIONS.sermons).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      tags: data.tags || [],
      topics: data.topics || [],
      ...data,
      publishedAt: toDate(data.publishedAt),
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Sermon
  }

  static async create(data: Omit<Sermon, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>): Promise<Sermon> {
    const sermonData = {
      ...data,
      tags: data.tags || [],
      topics: data.topics || [],
      publishedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.sermons).doc()
    await docRef.set(sermonData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      publishedAt: toDate(createdData.publishedAt),
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as Sermon
  }

  static async findByChurch(
    churchId: string,
    options?: {
      category?: string
      search?: string
      tag?: string
      limit?: number
      lastDocId?: string
    }
  ): Promise<Sermon[]> {
    let query: Query = db.collection(COLLECTIONS.sermons)
      .where('churchId', '==', churchId)

    if (options?.category) {
      query = query.where('category', '==', options.category)
    }

    if (options?.tag) {
      query = query.where('tags', 'array-contains', options.tag)
    }

    query = query.orderBy('createdAt', 'desc').limit(options?.limit || 20)

    if (options?.lastDocId) {
      const lastDoc = await db.collection(COLLECTIONS.sermons).doc(options.lastDocId).get()
      query = query.startAfter(lastDoc)
    }

    const snapshot = await query.get()
    let sermons = snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        tags: data.tags || [],
        topics: data.topics || [],
        ...data,
        publishedAt: toDate(data.publishedAt),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Sermon
    })

    // Filter by search term if provided (Firestore doesn't support full-text search)
    if (options?.search) {
      const searchLower = options.search.toLowerCase()
      sermons = sermons.filter((sermon: any) =>
        sermon.title.toLowerCase().includes(searchLower) ||
        sermon.description?.toLowerCase().includes(searchLower) ||
        sermon.speaker.toLowerCase().includes(searchLower) ||
        sermon.topics.some((topic: any) => topic.toLowerCase().includes(searchLower))
      )
    }

    return sermons
  }

  static async update(id: string, data: Partial<Sermon>): Promise<Sermon> {
    const updateData: any = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    }

    // Remove id, createdAt, updatedAt from update
    delete updateData.id
    delete updateData.createdAt
    delete updateData.updatedAt

    await db.collection(COLLECTIONS.sermons).doc(id).update(updateData)
    return this.findById(id) as Promise<Sermon>
  }
}

