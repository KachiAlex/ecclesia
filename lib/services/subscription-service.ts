import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'
import { LicensingPlanConfig, LICENSING_PLANS } from '@/lib/licensing/plans'

export interface SubscriptionPlan {
  id: string
  code?: string
  name: string
  type: string
  description?: string
  price: number
  currency: string
  maxUsers?: number
  maxStorageGB?: number
  maxSermons?: number
  maxEvents?: number
  maxDepartments?: number
  maxGroups?: number
  features: string[]
  billingCycle: string
  trialDays: number
  createdAt: Date
  updatedAt: Date
}

export interface Subscription {
  id: string
  churchId: string
  planId: string
  status: string
  startDate: Date
  endDate?: Date
  trialEndsAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface UsageMetric {
  id: string
  churchId: string
  metricType: string
  value: number
  period: string
  createdAt: Date
}

export class SubscriptionPlanService {
  static async findAll(): Promise<SubscriptionPlan[]> {
    await Promise.all(LICENSING_PLANS.map((plan) => this.ensurePlanFromConfig(plan)))

    const snapshot = await db.collection(COLLECTIONS.subscriptionPlans)
      .orderBy('price', 'asc')
      .get()

    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        features: data.features || [],
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as SubscriptionPlan
    })
  }

  static async findById(id: string): Promise<SubscriptionPlan | null> {
    const doc = await db.collection(COLLECTIONS.subscriptionPlans).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      features: data.features || [],
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as SubscriptionPlan
  }

  static async create(data: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubscriptionPlan> {
    const planData = {
      ...data,
      features: data.features || [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.subscriptionPlans).doc()
    await docRef.set(planData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as SubscriptionPlan
  }

  static async update(
    id: string,
    data: Partial<Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<SubscriptionPlan | null> {
    const docRef = db.collection(COLLECTIONS.subscriptionPlans).doc(id)
    const existing = await docRef.get()

    if (!existing.exists) return null

    await docRef.update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updated = await docRef.get()
    const updatedData = updated.data()

    if (!updatedData) return null

    return {
      id: updated.id,
      features: updatedData.features || [],
      ...updatedData,
      createdAt: toDate(updatedData.createdAt),
      updatedAt: toDate(updatedData.updatedAt),
    } as SubscriptionPlan
  }

  static async ensurePlanFromConfig(config: LicensingPlanConfig): Promise<SubscriptionPlan> {
    const docRef = db.collection(COLLECTIONS.subscriptionPlans).doc(config.id)
    const existing = await docRef.get()

    if (!existing.exists) {
      await docRef.set({
        name: config.name,
        code: config.id,
        type: config.tier,
        description: config.description,
        price: config.priceMonthlyRange.min,
        currency: 'USD',
        maxUsers: config.limits?.maxUsers,
        maxStorageGB: config.limits?.maxStorageGB,
        maxSermons: config.limits?.maxSermons,
        maxEvents: config.limits?.maxEvents,
        maxDepartments: config.limits?.maxDepartments,
        maxGroups: config.limits?.maxGroups,
        features: config.features,
        billingCycle: 'monthly',
        trialDays: 30,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    const snapshot = existing.exists ? existing : await docRef.get()
    const data = snapshot.data()!
    return {
      id: snapshot.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as SubscriptionPlan
  }
}

export class SubscriptionService {
  static async findByChurch(churchId: string): Promise<Subscription | null> {
    // NOTE: Avoid composite index requirements by not combining `where(churchId == ...)`
    // with `orderBy(startDate)`.
    const snapshot = await db.collection(COLLECTIONS.subscriptions)
      .where('churchId', '==', churchId)
      .get()

    if (snapshot.empty) return null

    const docs = snapshot.docs
      .map((doc: any) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          startDate: toDate(data.startDate),
          endDate: data.endDate ? toDate(data.endDate) : undefined,
          trialEndsAt: data.trialEndsAt ? toDate(data.trialEndsAt) : undefined,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as Subscription
      })

    const activeStatuses = new Set(['ACTIVE', 'TRIAL'])
    const active = docs.filter(s => activeStatuses.has(String((s as any).status)))
    const candidates = active.length > 0 ? active : docs

    return candidates.reduce((latest, cur) => {
      return cur.startDate > latest.startDate ? cur : latest
    }, candidates[0])
  }

  static async create(data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    const subscriptionData = {
      ...data,
      startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
      endDate: data.endDate ? (data.endDate instanceof Date ? data.endDate : new Date(data.endDate)) : null,
      trialEndsAt: data.trialEndsAt ? (data.trialEndsAt instanceof Date ? data.trialEndsAt : new Date(data.trialEndsAt)) : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.subscriptions).doc()
    await docRef.set(subscriptionData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      startDate: toDate(createdData.startDate),
      endDate: createdData.endDate ? toDate(createdData.endDate) : undefined,
      trialEndsAt: createdData.trialEndsAt ? toDate(createdData.trialEndsAt) : undefined,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as Subscription
  }
}

export class UsageMetricService {
  static async findByChurch(churchId: string, metricType?: string): Promise<UsageMetric[]> {
    // NOTE: Avoid composite index requirements by not combining `where(churchId == ...)`
    // with `orderBy(createdAt)` or additional filters.
    const snapshot = await db.collection(COLLECTIONS.usageMetrics)
      .where('churchId', '==', churchId)
      .get()

    const all = snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
      } as UsageMetric
    })

    const filtered = metricType
      ? all.filter(m => String((m as any).metricType) === metricType)
      : all

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return filtered.slice(0, 100)
  }

  static async create(data: Omit<UsageMetric, 'id' | 'createdAt'>): Promise<UsageMetric> {
    const metricData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.usageMetrics).doc()
    await docRef.set(metricData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
    } as UsageMetric
  }
}

