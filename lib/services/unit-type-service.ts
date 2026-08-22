import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export type UnitTypeJoinPolicy = 'INVITE_ONLY' | 'OPEN' | 'REQUEST'
export type UnitTypeCreationPolicy = 'ADMIN_ONLY' | 'ANYONE'

export interface UnitType {
  id: string
  churchId: string
  name: string
  description?: string
  allowMultiplePerUser: boolean
  joinPolicy: UnitTypeJoinPolicy
  creationPolicy: UnitTypeCreationPolicy
  createdAt: Date
  updatedAt: Date
}

export class UnitTypeService {
  static async create(data: Omit<UnitType, 'id' | 'createdAt' | 'updatedAt'>): Promise<UnitType> {
    const payload = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const ref = db.collection(COLLECTIONS.unitTypes).doc()
    await ref.set(payload)
    return (await this.findById(ref.id)) as UnitType
  }

  static async findById(id: string): Promise<UnitType | null> {
    const doc = await db.collection(COLLECTIONS.unitTypes).doc(id).get()
    if (!doc.exists) return null
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as UnitType
  }

  static async findByChurch(churchId: string, limit: number = 200): Promise<UnitType[]> {
    const snap = await db.collection(COLLECTIONS.unitTypes).where('churchId', '==', churchId).limit(limit).get()
    return snap.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as UnitType
    })
  }

  static async update(
    id: string,
    patch: Partial<Pick<UnitType, 'name' | 'description' | 'allowMultiplePerUser' | 'joinPolicy' | 'creationPolicy'>>
  ): Promise<UnitType> {
    await db.collection(COLLECTIONS.unitTypes).doc(id).update({
      ...patch,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return (await this.findById(id)) as UnitType
  }
}
