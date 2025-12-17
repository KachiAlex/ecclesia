import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export type LivestreamPlatform = 'youtube' | 'facebook'

export interface LivestreamConfig {
  id: string
  churchId: string
  enabled: boolean
  platform: LivestreamPlatform
  url: string
  title?: string
  description?: string
  scheduledAt?: Date
  createdAt: Date
  updatedAt: Date
}

export class LivestreamService {
  static async findByChurch(churchId: string): Promise<LivestreamConfig | null> {
    const snapshot = await db.collection(COLLECTIONS.livestreams)
      .where('churchId', '==', churchId)
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      scheduledAt: data.scheduledAt ? toDate(data.scheduledAt) : undefined,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as LivestreamConfig
  }

  static async upsertByChurch(
    churchId: string,
    data: Omit<LivestreamConfig, 'id' | 'churchId' | 'createdAt' | 'updatedAt'>
  ): Promise<LivestreamConfig> {
    const existing = await this.findByChurch(churchId)

    if (existing) {
      await db.collection(COLLECTIONS.livestreams).doc(existing.id).update({
        ...data,
        churchId,
        updatedAt: FieldValue.serverTimestamp(),
      })

      const updated = await db.collection(COLLECTIONS.livestreams).doc(existing.id).get()
      const updatedData = updated.data()!
      return {
        id: updated.id,
        ...updatedData,
        scheduledAt: updatedData.scheduledAt ? toDate(updatedData.scheduledAt) : undefined,
        createdAt: toDate(updatedData.createdAt),
        updatedAt: toDate(updatedData.updatedAt),
      } as LivestreamConfig
    }

    const docRef = db.collection(COLLECTIONS.livestreams).doc()
    await docRef.set({
      ...data,
      churchId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      scheduledAt: createdData.scheduledAt ? toDate(createdData.scheduledAt) : undefined,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as LivestreamConfig
  }
}
