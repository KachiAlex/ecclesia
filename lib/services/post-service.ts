import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue, Query } from 'firebase-admin/firestore'

export interface Post {
  id: string
  userId: string
  churchId: string
  content: string
  type: string
  imageUrl?: string
  likes: number
  createdAt: Date
  updatedAt: Date
}

export class PostService {
  static async findById(id: string): Promise<Post | null> {
    const doc = await db.collection(COLLECTIONS.posts).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Post
  }

  static async create(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likes'>): Promise<Post> {
    const postData = {
      ...data,
      likes: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.posts).doc()
    await docRef.set(postData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as Post
  }

  static async findByChurch(churchId: string, limit: number = 20, lastDocId?: string): Promise<Post[]> {
    let query: Query = db.collection(COLLECTIONS.posts)
      .where('churchId', '==', churchId)
      .orderBy('createdAt', 'desc')
      .limit(limit)

    if (lastDocId) {
      const lastDoc = await db.collection(COLLECTIONS.posts).doc(lastDocId).get()
      query = query.startAfter(lastDoc)
    }

    const snapshot = await query.get()
    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Post
    })
  }

  static async findByUser(userId: string, limit: number = 20): Promise<Post[]> {
    const snapshot = await db.collection(COLLECTIONS.posts)
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
        updatedAt: toDate(data.updatedAt),
      } as Post
    })
  }

  static async incrementLikes(id: string): Promise<void> {
    await db.collection(COLLECTIONS.posts).doc(id).update({
      likes: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  static async decrementLikes(id: string): Promise<void> {
    await db.collection(COLLECTIONS.posts).doc(id).update({
      likes: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  static async delete(id: string): Promise<void> {
    await db.collection(COLLECTIONS.posts).doc(id).delete()
  }
}

