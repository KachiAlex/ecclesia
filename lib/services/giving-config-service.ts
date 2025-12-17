import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export interface GivingConfig {
  id: string
  churchId: string
  paymentMethods: {
    stripe?: {
      enabled: boolean
      publicKey?: string
      secretKey?: string
    }
    paystack?: {
      enabled: boolean
      publicKey?: string
      secretKey?: string
    }
    flutterwave?: {
      enabled: boolean
      publicKey?: string
      secretKey?: string
      webhookSecretHash?: string
    }
    bankTransfer?: {
      enabled: boolean
      banks: Array<{
        id: string
        bankName: string
        accountNumber: string
        accountName: string
        currency: string
        instructions?: string
      }>
    }
  }
  currency: string
  defaultMethod?: string
  createdAt: Date
  updatedAt: Date
}

export class GivingConfigService {
  static async findByChurch(churchId: string): Promise<GivingConfig | null> {
    const snapshot = await db.collection(COLLECTIONS.givingConfig)
      .where('churchId', '==', churchId)
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as GivingConfig
  }

  static async create(data: Omit<GivingConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<GivingConfig> {
    const configData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.givingConfig).doc()
    await docRef.set(configData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as GivingConfig
  }

  static async update(id: string, data: Partial<Omit<GivingConfig, 'id' | 'churchId' | 'createdAt' | 'updatedAt'>>): Promise<GivingConfig> {
    await db.collection(COLLECTIONS.givingConfig).doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    })

    const doc = await db.collection(COLLECTIONS.givingConfig).doc(id).get()
    const docData = doc.data()!
    return {
      id: doc.id,
      ...docData,
      createdAt: toDate(docData.createdAt),
      updatedAt: toDate(docData.updatedAt),
    } as GivingConfig
  }
}

