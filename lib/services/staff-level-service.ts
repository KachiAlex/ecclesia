import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'
import type { DocumentSnapshot } from 'firebase-admin/firestore'

export type PayFrequencyOption = 'weekly' | 'biweekly' | 'monthly' | 'annual'
export const STAFF_PAY_FREQUENCIES: PayFrequencyOption[] = ['weekly', 'biweekly', 'monthly', 'annual']

export interface StaffLevel {
  id: string
  churchId: string
  name: string
  description?: string
  defaultWageAmount: number
  currency: string
  payFrequency: PayFrequencyOption
  order: number
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface StaffLevelInput {
  churchId: string
  name: string
  description?: string
  defaultWageAmount: number
  currency: string
  payFrequency: PayFrequencyOption
  order?: number
  isDefault?: boolean
}

const toDate = (value: any): Date => (value?.toDate ? value.toDate() : value ? new Date(value) : new Date())

export class StaffLevelService {
  static collection() {
    return db.collection(COLLECTIONS.staffLevels)
  }

  private static mapDoc(doc: DocumentSnapshot): StaffLevel {
    const data = doc.data()!
    return {
      id: doc.id,
      churchId: data.churchId,
      name: data.name,
      description: data.description,
      defaultWageAmount: data.defaultWageAmount,
      currency: data.currency,
      payFrequency: data.payFrequency,
      order: typeof data.order === 'number' ? data.order : 0,
      isDefault: Boolean(data.isDefault),
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    }
  }

  static async listByChurch(churchId: string): Promise<StaffLevel[]> {
    const snapshot = await this.collection().where('churchId', '==', churchId).get()
    return snapshot.docs
      .map((doc) => this.mapDoc(doc))
      .sort((a, b) => {
        const orderDiff = (a.order ?? 0) - (b.order ?? 0)
        if (orderDiff !== 0) return orderDiff
        return a.name.localeCompare(b.name)
      })
  }

  static async get(churchId: string, staffLevelId: string): Promise<StaffLevel | null> {
    const doc = await this.collection().doc(staffLevelId).get()
    if (!doc.exists) return null
    const data = doc.data()!
    if (data.churchId !== churchId) return null
    return this.mapDoc(doc)
  }

  static async create(input: StaffLevelInput): Promise<StaffLevel> {
    const docRef = this.collection().doc()
    const payload = {
      churchId: input.churchId,
      name: input.name,
      description: input.description ?? '',
      defaultWageAmount: input.defaultWageAmount,
      currency: input.currency,
      payFrequency: input.payFrequency,
      order: typeof input.order === 'number' ? input.order : Date.now(),
      isDefault: Boolean(input.isDefault),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    await docRef.set(payload)
    const created = await docRef.get()
    return this.mapDoc(created)
  }

  static async update(
    churchId: string,
    staffLevelId: string,
    updates: Partial<Omit<StaffLevelInput, 'churchId'>>,
  ): Promise<StaffLevel | null> {
    const docRef = this.collection().doc(staffLevelId)
    const existing = await docRef.get()
    if (!existing.exists) return null
    const data = existing.data()!
    if (data.churchId !== churchId) {
      throw new Error('Cannot edit staff level from another church')
    }

    await docRef.update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updated = await docRef.get()
    return this.mapDoc(updated)
  }

  static async delete(churchId: string, staffLevelId: string): Promise<void> {
    const docRef = this.collection().doc(staffLevelId)
    const existing = await docRef.get()
    if (!existing.exists) return
    const data = existing.data()!
    if (data.churchId !== churchId) {
      throw new Error('Cannot delete staff level from another church')
    }
    await docRef.delete()
  }
}
