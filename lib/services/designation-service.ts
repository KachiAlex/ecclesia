import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export interface ChurchDesignation {
  id: string
  churchId: string
  name: string
  description?: string
  category?: 'Worker' | 'Leader' | 'Admin'
  key?: string
  isDefault?: boolean
  isProtected?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ChurchDesignationInput {
  churchId: string
  name: string
  description?: string
  category?: 'Worker' | 'Leader' | 'Admin'
}

const DEFAULT_DESIGNATIONS: Array<Omit<ChurchDesignation, 'id' | 'churchId' | 'createdAt' | 'updatedAt'>> = [
  {
    name: 'Worker',
    description: 'Default designation for workers',
    category: 'Worker',
    key: 'WORKER_DEFAULT',
    isDefault: true,
    isProtected: true,
  },
]

const toDate = (value: any): Date => (value?.toDate ? value.toDate() : value ? new Date(value) : new Date())

export class DesignationService {
  static collection() {
    return db.collection(COLLECTIONS.churchDesignations)
  }

  private static async ensureDefaults(churchId: string) {
    await Promise.all(
      DEFAULT_DESIGNATIONS.map(async (designation) => {
        const snapshot = await this.collection()
          .where('churchId', '==', churchId)
          .where('key', '==', designation.key)
          .limit(1)
          .get()

        if (snapshot.empty) {
          const docRef = this.collection().doc()
          await docRef.set({
            churchId,
            ...designation,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          })
        }
      }),
    )
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
      key: data.key,
      isDefault: data.isDefault,
      isProtected: data.isProtected,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    }
  }

  static async listByChurch(churchId: string): Promise<ChurchDesignation[]> {
    await this.ensureDefaults(churchId)
    const snapshot = await this.collection().where('churchId', '==', churchId).get()
    const designations = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        churchId: data.churchId,
        name: data.name,
        description: data.description,
        category: data.category,
        key: data.key,
        isDefault: data.isDefault,
        isProtected: data.isProtected,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      }
    })

    return designations.sort((a, b) => a.name.localeCompare(b.name))
  }

  static async create(input: ChurchDesignationInput): Promise<ChurchDesignation> {
    await this.ensureDefaults(input.churchId)
    const docRef = this.collection().doc()
    const payload = {
      churchId: input.churchId,
      name: input.name,
      description: input.description ?? '',
      category: input.category ?? 'Worker',
      key: null,
      isDefault: false,
      isProtected: false,
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
      key: data.key ?? undefined,
      isDefault: data.isDefault,
      isProtected: data.isProtected,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    }
  }

  static async update(
    designationId: string,
    churchId: string,
    updates: Partial<Omit<ChurchDesignationInput, 'churchId'>>,
  ): Promise<ChurchDesignation | null> {
    const docRef = this.collection().doc(designationId)
    const existing = await docRef.get()
    if (!existing.exists) return null
    const data = existing.data()!
    if (data.churchId !== churchId) {
      throw new Error('Cannot edit designation from another church')
    }
    if (data.isProtected) {
      throw new Error('Cannot edit default designation')
    }

    await docRef.update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updated = await docRef.get()
    const updatedData = updated.data()!
    return {
      id: updated.id,
      churchId: updatedData.churchId,
      name: updatedData.name,
      description: updatedData.description,
      category: updatedData.category,
      key: updatedData.key,
      isDefault: updatedData.isDefault,
      isProtected: updatedData.isProtected,
      createdAt: toDate(updatedData.createdAt),
      updatedAt: toDate(updatedData.updatedAt),
    }
  }

  static async delete(designationId: string, churchId: string): Promise<void> {
    const docRef = this.collection().doc(designationId)
    const existing = await docRef.get()
    if (!existing.exists) return
    const data = existing.data()!
    if (data.churchId !== churchId) {
      throw new Error('Cannot delete designation from another church')
    }
    if (data.isProtected) {
      throw new Error('Cannot delete default designation')
    }
    await docRef.delete()
  }
}
