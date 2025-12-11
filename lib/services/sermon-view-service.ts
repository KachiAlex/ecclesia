import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export interface SermonView {
  id: string
  userId: string
  sermonId: string
  watchedDuration: number
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SermonDownload {
  id: string
  userId: string
  sermonId: string
  downloadedAt: Date
}

export class SermonViewService {
  static async findByUserAndSermon(userId: string, sermonId: string): Promise<SermonView | null> {
    const snapshot = await db.collection(COLLECTIONS.sermonViews)
      .where('userId', '==', userId)
      .where('sermonId', '==', sermonId)
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      watchedDuration: data.watchedDuration || 0,
      completed: data.completed || false,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as SermonView
  }

  static async upsert(userId: string, sermonId: string, watchedDuration: number, completed: boolean): Promise<SermonView> {
    // Check if exists
    const existing = await this.findByUserAndSermon(userId, sermonId)

    if (existing) {
      // Update
      await db.collection(COLLECTIONS.sermonViews).doc(existing.id).update({
        watchedDuration,
        completed,
        updatedAt: FieldValue.serverTimestamp(),
      })
      const updated = await db.collection(COLLECTIONS.sermonViews).doc(existing.id).get()
      const data = updated.data()!
      return {
        id: updated.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as SermonView
    } else {
      // Create
      const viewData = {
        userId,
        sermonId,
        watchedDuration,
        completed,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }

      const docRef = db.collection(COLLECTIONS.sermonViews).doc()
      await docRef.set(viewData)

      const created = await docRef.get()
      const createdData = created.data()!
      return {
        id: created.id,
        ...createdData,
        createdAt: toDate(createdData.createdAt),
        updatedAt: toDate(createdData.updatedAt),
      } as SermonView
    }
  }

  static async findByUser(userId: string): Promise<SermonView[]> {
    const snapshot = await db.collection(COLLECTIONS.sermonViews)
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .get()

    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        watchedDuration: data.watchedDuration || 0,
        completed: data.completed || false,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as SermonView
    })
  }
}

export class SermonDownloadService {
  static async findByUserAndSermon(userId: string, sermonId: string): Promise<SermonDownload | null> {
    const snapshot = await db.collection(COLLECTIONS.sermonDownloads)
      .where('userId', '==', userId)
      .where('sermonId', '==', sermonId)
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      downloadedAt: toDate(data.downloadedAt),
    } as SermonDownload
  }

  static async create(userId: string, sermonId: string): Promise<SermonDownload> {
    // Check if already downloaded
    const existing = await this.findByUserAndSermon(userId, sermonId)
    if (existing) {
      return existing
    }

    const downloadData = {
      userId,
      sermonId,
      downloadedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.sermonDownloads).doc()
    await docRef.set(downloadData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      downloadedAt: toDate(createdData.downloadedAt),
    } as SermonDownload
  }
}

