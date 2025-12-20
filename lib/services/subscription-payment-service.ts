import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export type SubscriptionPaymentStatus = 'INITIATED' | 'PAID' | 'APPLIED' | 'FAILED'

export interface SubscriptionPayment {
  id: string
  reference: string
  churchId: string
  planId: string
  amount: number
  currency: string
  status: SubscriptionPaymentStatus
  initiatedBy: string
  authorizationUrl?: string
  transactionId?: string
  metadata?: Record<string, any>
  rawEvent?: any
  createdAt: Date
  updatedAt: Date
  paidAt?: Date
  appliedAt?: Date
  lastError?: string
}

type CreateSubscriptionPaymentInput = {
  reference: string
  churchId: string
  planId: string
  amount: number
  currency: string
  initiatedBy: string
  authorizationUrl?: string
  metadata?: Record<string, any>
  status?: SubscriptionPaymentStatus
}

type UpdateSubscriptionPaymentInput = Partial<
  Omit<SubscriptionPayment, 'id' | 'createdAt' | 'updatedAt'>
>

export class SubscriptionPaymentService {
  private static collection() {
    return db.collection(COLLECTIONS.subscriptionPayments)
  }

  private static serialize(doc: FirebaseFirestore.DocumentSnapshot) {
    const data = doc.data()
    if (!data) return null

    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      paidAt: toDate(data.paidAt),
      appliedAt: toDate(data.appliedAt),
    } as SubscriptionPayment
  }

  static newId() {
    return this.collection().doc().id
  }

  static async create(data: CreateSubscriptionPaymentInput, id?: string) {
    const docRef = id ? this.collection().doc(id) : this.collection().doc()

    await docRef.set({
      reference: data.reference,
      churchId: data.churchId,
      planId: data.planId,
      amount: data.amount,
      currency: data.currency,
      initiatedBy: data.initiatedBy,
      authorizationUrl: data.authorizationUrl || null,
      rawEvent: null,
      metadata: data.metadata || {},
      status: data.status || 'INITIATED',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    const snapshot = await docRef.get()
    return this.serialize(snapshot)!
  }

  static async findById(id: string) {
    const doc = await this.collection().doc(id).get()
    if (!doc.exists) return null
    return this.serialize(doc)
  }

  static async findByReference(reference: string) {
    const snapshot = await this.collection()
      .where('reference', '==', reference)
      .limit(1)
      .get()

    if (snapshot.empty) return null
    return this.serialize(snapshot.docs[0])
  }

  static async update(id: string, data: UpdateSubscriptionPaymentInput) {
    await this.collection().doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  static async markPaid(
    id: string,
    options: { transactionId?: string; rawEvent?: any; amount?: number; currency?: string }
  ) {
    const update: Record<string, any> = {
      status: 'PAID',
      amount: options.amount,
      currency: options.currency,
      paidAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (options.transactionId) {
      update.transactionId = options.transactionId
    }

    if (options.rawEvent) {
      update.rawEvent = options.rawEvent
    }

    if (options.amount === undefined) {
      delete update.amount
    }

    if (options.currency === undefined) {
      delete update.currency
    }

    await this.collection().doc(id).update(update)
  }

  static async markApplied(id: string) {
    await this.collection().doc(id).update({
      status: 'APPLIED',
      appliedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  static async markFailed(id: string, error: string) {
    await this.collection().doc(id).update({
      status: 'FAILED',
      lastError: error,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
}
