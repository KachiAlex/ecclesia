import { db, FieldValue, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export type LandingPlanPaymentStatus = 'INITIATED' | 'PAID' | 'FAILED'

export interface LandingPlanPayment {
  id: string
  reference: string
  planId: string
  planName: string
  amount: number
  currency: string
  fullName: string
  email: string
  churchName?: string
  phone?: string
  promoCode?: string
  notes?: string
  status: LandingPlanPaymentStatus
  authorizationUrl?: string
  transactionId?: string | null
  rawEvent?: any
  createdAt: Date
  updatedAt: Date
  paidAt?: Date
  lastError?: string | null
}

export type LandingPlanPaymentCreateInput = {
  reference: string
  planId: string
  planName: string
  amount: number
  currency: string
  fullName: string
  email: string
  churchName?: string
  phone?: string
  promoCode?: string
  notes?: string
  status?: LandingPlanPaymentStatus
  authorizationUrl?: string
  transactionId?: string | null
  rawEvent?: any
  lastError?: string | null
}

export class LandingPaymentService {
  private static collection() {
    return db.collection(COLLECTIONS.landingPlanPayments)
  }

  private static serialize(doc: FirebaseFirestore.DocumentSnapshot): LandingPlanPayment | null {
    const data = doc.data()
    if (!data) return null
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      paidAt: data.paidAt ? toDate(data.paidAt) : undefined,
    } as LandingPlanPayment
  }

  static async create(input: LandingPlanPaymentCreateInput) {
    const docRef = this.collection().doc(input.reference)
    await docRef.set({
      ...input,
      status: input.status || 'INITIATED',
      transactionId: input.transactionId || null,
      rawEvent: input.rawEvent || null,
      lastError: input.lastError || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    const snapshot = await docRef.get()
    return this.serialize(snapshot)
  }

  static async update(
    reference: string,
    data: Partial<Omit<LandingPlanPayment, 'id' | 'createdAt' | 'updatedAt'>>
  ) {
    await this.collection().doc(reference).set(
      {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  }

  static async findByReference(reference: string) {
    const doc = await this.collection().doc(reference).get()
    return doc.exists ? this.serialize(doc) : null
  }

  static async markPaid(
    reference: string,
    options: { transactionId?: string; rawEvent?: any }
  ) {
    await this.collection().doc(reference).set(
      {
        status: 'PAID',
        transactionId: options.transactionId || null,
        rawEvent: options.rawEvent || null,
        paidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastError: null,
      },
      { merge: true }
    )
  }

  static async markFailed(reference: string, reason?: string, options?: { rawEvent?: any }) {
    await this.collection().doc(reference).set(
      {
        status: 'FAILED',
        lastError: reason || null,
        rawEvent: options?.rawEvent || null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  }
}
