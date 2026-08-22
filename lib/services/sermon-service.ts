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
  searchKeywords?: string[]
  viewsCount?: number
  downloadsCount?: number
  publishedAt: Date
  createdAt: Date
  updatedAt: Date
}

export class SermonService {
  private static buildSearchKeywords(input: {
    title?: string
    description?: string
    speaker?: string
    tags?: string[]
    topics?: string[]
    category?: string
  }): string[] {
    const raw = [
      input.title,
      input.description,
      input.speaker,
      input.category,
      ...(input.tags || []),
      ...(input.topics || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const tokens = raw
      .split(/[^a-z0-9]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2)

    return Array.from(new Set(tokens)).slice(0, 100)
  }

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
      searchKeywords: this.buildSearchKeywords({
        title: (data as any).title,
        description: (data as any).description,
        speaker: (data as any).speaker,
        tags: (data as any).tags || [],
        topics: (data as any).topics || [],
        category: (data as any).category,
      }),
      viewsCount: (data as any).viewsCount ?? 0,
      downloadsCount: (data as any).downloadsCount ?? 0,
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

    if (options?.search) {
      if (!options?.tag) {
        const tokens = this.buildSearchKeywords({ title: options.search })
        const searchTokens = tokens.slice(0, 10)

        if (searchTokens.length > 0) {
          query = query.where('searchKeywords', 'array-contains-any', searchTokens)
        }
      }
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

    return sermons
  }

  static async update(id: string, data: Partial<Sermon>): Promise<Sermon> {
    const updateData: any = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (
      updateData.title !== undefined ||
      updateData.description !== undefined ||
      updateData.speaker !== undefined ||
      updateData.category !== undefined ||
      updateData.tags !== undefined ||
      updateData.topics !== undefined
    ) {
      const existing = await this.findById(id)
      updateData.searchKeywords = this.buildSearchKeywords({
        title: updateData.title ?? existing?.title,
        description: updateData.description ?? existing?.description,
        speaker: updateData.speaker ?? existing?.speaker,
        category: updateData.category ?? existing?.category,
        tags: updateData.tags ?? existing?.tags,
        topics: updateData.topics ?? existing?.topics,
      })
    }

    // Remove id, createdAt, updatedAt from update
    delete updateData.id
    delete updateData.createdAt
    delete updateData.updatedAt

    await db.collection(COLLECTIONS.sermons).doc(id).update(updateData)
    return this.findById(id) as Promise<Sermon>
  }

  static async delete(id: string): Promise<void> {
    await db.collection(COLLECTIONS.sermons).doc(id).delete()
  }
}

