import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export interface Comment {
  id: string
  postId: string
  userId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export class CommentService {
  static async findById(id: string): Promise<Comment | null> {
    const doc = await db.collection(COLLECTIONS.comments).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Comment
  }

  static async create(data: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
    const commentData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.comments).doc()
    await docRef.set(commentData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as Comment
  }

  static async findByPost(postId: string, limit: number = 50): Promise<Comment[]> {
    const snapshot = await db.collection(COLLECTIONS.comments)
      .where('postId', '==', postId)
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .get()

    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Comment
    })
  }

  static async update(id: string, content: string): Promise<Comment> {
    await db.collection(COLLECTIONS.comments).doc(id).update({
      content,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return this.findById(id) as Promise<Comment>
  }

  static async delete(id: string): Promise<void> {
    await db.collection(COLLECTIONS.comments).doc(id).delete()
  }
}

