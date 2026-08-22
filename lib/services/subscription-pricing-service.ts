import { db, toDate, FieldValue } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export type DiscountType = 'percentage' | 'flat'
export type PromoScope = 'plan' | 'church' | 'global'

export interface SubscriptionPromo {
  code: string
  type: DiscountType
  value: number
  appliesTo: PromoScope
  planIds?: string[]
  churchIds?: string[]
  maxRedemptions?: number
  redeemedCount?: number
  validFrom?: Date
  validTo?: Date
  notes?: string
  status?: 'active' | 'inactive'
  createdBy?: string
  updatedBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface PlanOverrideInput {
  planId: string
  churchId: string
  customPrice?: number
  customSetupFee?: number
  promoCode?: string
  expiresAt?: Date | null
  notes?: string
  createdBy: string
}

export interface PlanOverride extends Omit<PlanOverrideInput, 'expiresAt' | 'createdBy'> {
  id: string
  expiresAt?: Date | null
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt: Date
}

function promoDoc(code: string) {
  return db.collection(COLLECTIONS.subscriptionPromos).doc(code.toUpperCase())
}

function overrideDoc(planId: string, churchId: string) {
  const id = `${planId}__${churchId}`
  return db.collection(COLLECTIONS.subscriptionPlanOverrides).doc(id)
}

export class SubscriptionPricingService {
  // Promo helpers
  static async listPromos(): Promise<SubscriptionPromo[]> {
    const snapshot = await db.collection(COLLECTIONS.subscriptionPromos).orderBy('createdAt', 'desc').get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        code: doc.id,
        ...data,
        validFrom: data.validFrom ? toDate(data.validFrom) : undefined,
        validTo: data.validTo ? toDate(data.validTo) : undefined,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as SubscriptionPromo
    })
  }

  static async getPromo(code: string): Promise<SubscriptionPromo | null> {
    if (!code) return null
    const docRef = promoDoc(code)
    const doc = await docRef.get()
    if (!doc.exists) return null
    const data = doc.data()!
    return {
      code: doc.id,
      ...data,
      validFrom: data.validFrom ? toDate(data.validFrom) : undefined,
      validTo: data.validTo ? toDate(data.validTo) : undefined,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as SubscriptionPromo
  }

  static async createPromo(data: Omit<SubscriptionPromo, 'createdAt' | 'updatedAt'>) {
    const code = data.code.toUpperCase()
    const now = FieldValue.serverTimestamp()
    await promoDoc(code).set({
      ...data,
      code,
      createdAt: now,
      updatedAt: now,
      validFrom: data.validFrom || FieldValue.serverTimestamp(),
      status: data.status || 'active',
      redeemedCount: data.redeemedCount || 0,
    })
    return this.getPromo(code)
  }

  static async updatePromo(code: string, updates: Partial<SubscriptionPromo>) {
    const docRef = promoDoc(code)
    const doc = await docRef.get()
    if (!doc.exists) {
      return null
    }
    const dataToUpdate: Record<string, any> = { ...updates, updatedAt: FieldValue.serverTimestamp() }
    if (updates.validFrom instanceof Date) dataToUpdate.validFrom = updates.validFrom
    if (updates.validTo instanceof Date) dataToUpdate.validTo = updates.validTo
    await docRef.update(dataToUpdate)
    return this.getPromo(code)
  }

  // Overrides
  static async setPlanOverride(input: PlanOverrideInput) {
    const docRef = overrideDoc(input.planId, input.churchId)
    const payload = {
      ...input,
      id: docRef.id,
      expiresAt: input.expiresAt ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }
    await docRef.set(payload, { merge: true })
    return this.getPlanOverride(input.planId, input.churchId)
  }

  static async getPlanOverride(planId: string, churchId: string): Promise<PlanOverride | null> {
    const docRef = overrideDoc(planId, churchId)
    const doc = await docRef.get()
    if (!doc.exists) return null
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      expiresAt: data.expiresAt ? toDate(data.expiresAt) : null,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as PlanOverride
  }

  static async deletePlanOverride(planId: string, churchId: string) {
    await overrideDoc(planId, churchId).delete()
  }

  static async listOverridesForChurch(churchId: string): Promise<PlanOverride[]> {
    const snapshot = await db
      .collection(COLLECTIONS.subscriptionPlanOverrides)
      .where('churchId', '==', churchId)
      .get()

    const overrides = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        expiresAt: data.expiresAt ? toDate(data.expiresAt) : null,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as PlanOverride
    })

    return overrides.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  static isPromoActive(promo: SubscriptionPromo): boolean {
    if (promo.status === 'inactive') return false
    const now = new Date()
    if (promo.validFrom && promo.validFrom > now) return false
    if (promo.validTo && promo.validTo < now) return false
    if (promo.maxRedemptions && (promo.redeemedCount ?? 0) >= promo.maxRedemptions) return false
    return true
  }

  static promoAppliesTo(promo: SubscriptionPromo, planId: string, churchId: string): boolean {
    if (promo.appliesTo === 'global') return true
    if (promo.appliesTo === 'plan') {
      return promo.planIds?.includes(planId) ?? false
    }
    if (promo.appliesTo === 'church') {
      return promo.churchIds?.includes(churchId) ?? false
    }
    return false
  }

  static applyDiscount(amount: number, promo: SubscriptionPromo) {
    if (promo.type === 'flat') {
      return Math.max(0, amount - promo.value)
    }
    // percentage
    const pct = Math.min(100, Math.max(0, promo.value))
    const discount = (amount * pct) / 100
    return Math.max(0, amount - discount)
  }

  static async calculateEffectivePrice(params: {
    planId: string
    churchId: string
    basePrice: number
    promoCode?: string | null
  }): Promise<{
    amount: number
    appliedPromo?: SubscriptionPromo
    override?: PlanOverride | null
    breakdown: {
      basePrice: number
      overridePrice?: number
      discount?: number
    }
  }> {
    const { planId, churchId, basePrice, promoCode } = params
    let amount = basePrice
    const breakdown: {
      basePrice: number
      overridePrice?: number
      discount?: number
    } = { basePrice }

    const override = await this.getPlanOverride(planId, churchId)
    if (override?.customPrice !== undefined && override.customPrice !== null) {
      amount = override.customPrice
      breakdown.overridePrice = override.customPrice
    }

    const promoCandidate = promoCode || override?.promoCode
    let appliedPromo: SubscriptionPromo | undefined
    if (promoCandidate) {
      const promo = await this.getPromo(promoCandidate)
      if (promo && this.isPromoActive(promo) && this.promoAppliesTo(promo, planId, churchId)) {
        const discounted = this.applyDiscount(amount, promo)
        breakdown.discount = amount - discounted
        amount = discounted
        appliedPromo = promo
      }
    }

    return { amount, appliedPromo, override, breakdown }
  }
}
