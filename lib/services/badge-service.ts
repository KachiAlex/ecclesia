import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { Query } from 'firebase-admin/firestore'
import { FieldValue } from 'firebase-admin/firestore'

export interface Badge {
  id: string
  name: string
  description?: string
  type: string
  icon?: string
  xpReward: number
  createdAt: Date
  updatedAt: Date
}

export interface UserBadge {
  id: string
  userId: string
  badgeId: string
  earnedAt: Date
}

export class BadgeService {
  static async findById(id: string): Promise<Badge | null> {
    const doc = await db.collection(COLLECTIONS.badges).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      xpReward: data.xpReward || 0,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Badge
  }

  static async findAll(type?: string): Promise<Badge[]> {
    let query: Query = db.collection(COLLECTIONS.badges)
    
    if (type) {
      query = query.where('type', '==', type)
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get()

    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        xpReward: data.xpReward || 0,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Badge
    })
  }

  static async create(data: Omit<Badge, 'id' | 'createdAt' | 'updatedAt'>): Promise<Badge> {
    const badgeData = {
      ...data,
      xpReward: data.xpReward || 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.badges).doc()
    await docRef.set(badgeData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as Badge
  }
}

export class UserBadgeService {
  static async findByUser(userId: string): Promise<UserBadge[]> {
    const snapshot = await db
      .collection(COLLECTIONS.userBadges)
      .where('userId', '==', userId)
      .get()

    return snapshot.docs
      .map((doc: any) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          earnedAt: toDate(data.earnedAt),
        } as UserBadge
      })
      .sort((a, b) => {
        const aTime = a.earnedAt?.getTime?.() ?? 0
        const bTime = b.earnedAt?.getTime?.() ?? 0
        return bTime - aTime
      })
  }

  static async findByUserAndBadge(userId: string, badgeId: string): Promise<UserBadge | null> {
    const snapshot = await db.collection(COLLECTIONS.userBadges)
      .where('userId', '==', userId)
      .where('badgeId', '==', badgeId)
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      earnedAt: toDate(data.earnedAt),
    } as UserBadge
  }

  static async create(userId: string, badgeId: string): Promise<UserBadge> {
    // Check if already earned
    const existing = await this.findByUserAndBadge(userId, badgeId)
    if (existing) {
      return existing
    }

    const badgeData = {
      userId,
      badgeId,
      earnedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.userBadges).doc()
    await docRef.set(badgeData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      earnedAt: toDate(createdData.earnedAt),
    } as UserBadge
  }
}

