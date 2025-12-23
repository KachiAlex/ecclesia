import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export interface ChurchDesignation {
  id: string
  churchId: string
  name: string
  description?: string
  category?: 'Worker' | 'Leader' | 'Admin'
  createdAt: Date
  updatedAt: Date
}

export interface ChurchDesignationInput {
  churchId: string
  name: string
  description?: string
  category?: 'Worker' | 'Leader' | 'Admin'
}

const toDate = (value: any): Date => (value?.toDate ? value.toDate() : value ? new Date(value) : new Date())

export class DesignationService {
  static collection() {
    return db.collection(COLLECTIONS.churchDesignations)
  }

  static async get(designationId: string): Promise<ChurchDesignation | null> {
    const doc = await this.collection().doc(designationId).get()
    if (!doc.exists) return null
    const data = doc.data()!
    return {
      id: doc.id,
      churchId: data.churchId,
      name: data.name,
      description: data.description,
      category: data.category,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    }
  }

  static async listByChurch(churchId: string): Promise<ChurchDesignation[]> {
    const snapshot = await this.collection().where('churchId', '==', churchId).orderBy('name').get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        churchId: data.churchId,
        name: data.name,
        description: data.description,
        category: data.category,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      }
    })
  }

  static async create(input: ChurchDesignationInput): Promise<ChurchDesignation> {
    const docRef = this.collection().doc()
    const payload = {
      churchId: input.churchId,
      name: input.name,
      description: input.description ?? '',
      category: input.category ?? 'Leader',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    await docRef.set(payload)
    const created = await docRef.get()
    const data = created.data()!
    return {
      id: created.id,
      churchId: data.churchId,
      name: data.name,
      description: data.description,
      category: data.category,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    }
  }

  static async update(designationId: string, updates: Partial<Omit<ChurchDesignationInput, 'churchId'>>): Promise<ChurchDesignation | null> {
    const docRef = this.collection().doc(designationId)
    const existing = await docRef.get()
    if (!existing.exists) return null

    await docRef.update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updated = await docRef.get()
    const data = updated.data()!
    return {
      id: updated.id,
      churchId: data.churchId,
      name: data.name,
      description: data.description,
      category: data.category,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    }
  }

  static async delete(designationId: string): Promise<void> {
    await this.collection().doc(designationId).delete()
  }
}
