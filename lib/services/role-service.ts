import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export interface ChurchRole {
  id: string
  churchId: string
  name: string
  description?: string
  key?: string
  isDefault: boolean
  isProtected: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface ChurchRoleInput {
  churchId: string
  name: string
  description?: string
}

const DEFAULT_ROLES: Array<Omit<ChurchRole, 'id' | 'churchId' | 'createdAt' | 'updatedAt'>> = [
  {
    name: 'Admin',
    description: 'Full administrative access with ability to manage everything.',
    key: 'ADMIN_DEFAULT',
    isDefault: true,
    isProtected: true,
    order: 0,
  },
  {
    name: 'Worker',
    description: 'Default worker role for all members.',
    key: 'WORKER_DEFAULT',
    isDefault: true,
    isProtected: true,
    order: 1,
  },
]

const toDate = (value: any): Date => (value?.toDate ? value.toDate() : value ? new Date(value) : new Date())

export class RoleService {
  static collection() {
    return db.collection(COLLECTIONS.churchRoles)
  }

  private static async ensureDefaultRoles(churchId: string) {
    await Promise.all(
      DEFAULT_ROLES.map(async (role) => {
        const snapshot = await this.collection()
          .where('churchId', '==', churchId)
          .where('key', '==', role.key)
          .limit(1)
          .get()

        if (snapshot.empty) {
          const docRef = this.collection().doc()
          await docRef.set({
            churchId,
            ...role,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          })
        }
      }),
    )
  }

  static async listByChurch(churchId: string): Promise<ChurchRole[]> {
    await this.ensureDefaultRoles(churchId)
    const snapshot = await this.collection().where('churchId', '==', churchId).get()
    const roles = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        churchId: data.churchId,
        name: data.name,
        description: data.description,
        key: data.key,
        isDefault: Boolean(data.isDefault),
        isProtected: Boolean(data.isProtected),
        order: typeof data.order === 'number' ? data.order : 99,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      }
    })

    return roles.sort((a, b) => {
      const orderDiff = a.order - b.order
      if (orderDiff !== 0) return orderDiff
      return a.name.localeCompare(b.name)
    })
  }

  static async get(roleId: string): Promise<ChurchRole | null> {
    const doc = await this.collection().doc(roleId).get()
    if (!doc.exists) return null
    const data = doc.data()!
    return {
      id: doc.id,
      churchId: data.churchId,
      name: data.name,
      description: data.description,
      key: data.key,
      isDefault: Boolean(data.isDefault),
      isProtected: Boolean(data.isProtected),
      order: typeof data.order === 'number' ? data.order : 99,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    }
  }

  static async getDefaultWorkerRole(churchId: string): Promise<ChurchRole | null> {
    await this.ensureDefaultRoles(churchId)
    const snapshot = await this.collection()
      .where('churchId', '==', churchId)
      .where('key', '==', 'WORKER_DEFAULT')
      .limit(1)
      .get()
    if (snapshot.empty) return null
    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      churchId: data.churchId,
      name: data.name,
      description: data.description,
      key: data.key,
      isDefault: Boolean(data.isDefault),
      isProtected: Boolean(data.isProtected),
      order: typeof data.order === 'number' ? data.order : 99,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    }
  }

  static async create(input: ChurchRoleInput): Promise<ChurchRole> {
    await this.ensureDefaultRoles(input.churchId)
    const docRef = this.collection().doc()
    const payload = {
      churchId: input.churchId,
      name: input.name,
      description: input.description ?? '',
      key: null,
      isDefault: false,
      isProtected: false,
      order: Date.now(),
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
      key: data.key ?? undefined,
      isDefault: Boolean(data.isDefault),
      isProtected: Boolean(data.isProtected),
      order: typeof data.order === 'number' ? data.order : 99,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    }
  }

  static async delete(roleId: string, churchId: string): Promise<void> {
    const docRef = this.collection().doc(roleId)
    const existing = await docRef.get()
    if (!existing.exists) return
    const data = existing.data()!
    if (data.churchId !== churchId) {
      throw new Error('Cannot delete role from another church')
    }
    if (data.isProtected) {
      throw new Error('Cannot delete default roles')
    }
    await docRef.delete()
  }
}
