import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export interface ReadingPlan {
  id: string
  title: string
  description?: string
  duration: number
  startDate?: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ReadingPlanProgress {
  id: string
  userId: string
  planId: string
  currentDay: number
  completed: boolean
  startedAt: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export class ReadingPlanService {
  static async findById(id: string): Promise<ReadingPlan | null> {
    const doc = await db.collection(COLLECTIONS.readingPlans).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate ? toDate(data.startDate) : undefined,
      endDate: data.endDate ? toDate(data.endDate) : undefined,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as ReadingPlan
  }

  static async findAll(limit: number = 50): Promise<ReadingPlan[]> {
    const snapshot = await db.collection(COLLECTIONS.readingPlans)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate ? toDate(data.startDate) : undefined,
        endDate: data.endDate ? toDate(data.endDate) : undefined,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as ReadingPlan
    })
  }

  static async create(data: Omit<ReadingPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReadingPlan> {
    const planData = {
      ...data,
      startDate: data.startDate ? (data.startDate instanceof Date ? data.startDate : new Date(data.startDate)) : null,
      endDate: data.endDate ? (data.endDate instanceof Date ? data.endDate : new Date(data.endDate)) : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.readingPlans).doc()
    await docRef.set(planData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      startDate: createdData.startDate ? toDate(createdData.startDate) : undefined,
      endDate: createdData.endDate ? toDate(createdData.endDate) : undefined,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as ReadingPlan
  }
}

export class ReadingPlanProgressService {
  static async findById(id: string): Promise<ReadingPlanProgress | null> {
    const doc = await db.collection(COLLECTIONS.readingPlanProgress).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      startedAt: toDate(data.startedAt),
      completedAt: data.completedAt ? toDate(data.completedAt) : undefined,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as ReadingPlanProgress
  }

  static async findByUser(userId: string): Promise<ReadingPlanProgress[]> {
    const snapshot = await db.collection(COLLECTIONS.readingPlanProgress)
      .where('userId', '==', userId)
      .orderBy('startedAt', 'desc')
      .get()

    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        startedAt: toDate(data.startedAt),
        completedAt: data.completedAt ? toDate(data.completedAt) : undefined,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as ReadingPlanProgress
    })
  }

  static async findByUserAndPlan(userId: string, planId: string): Promise<ReadingPlanProgress | null> {
    const snapshot = await db.collection(COLLECTIONS.readingPlanProgress)
      .where('userId', '==', userId)
      .where('planId', '==', planId)
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      startedAt: toDate(data.startedAt),
      completedAt: data.completedAt ? toDate(data.completedAt) : undefined,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as ReadingPlanProgress
  }

  static async create(data: Omit<ReadingPlanProgress, 'id' | 'createdAt' | 'updatedAt' | 'startedAt' | 'completedAt'>): Promise<ReadingPlanProgress> {
    const progressData = {
      ...data,
      currentDay: 1,
      completed: false,
      startedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.readingPlanProgress).doc()
    await docRef.set(progressData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      startedAt: toDate(createdData.startedAt),
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as ReadingPlanProgress
  }

  static async updateProgress(id: string, currentDay: number, completed?: boolean): Promise<ReadingPlanProgress> {
    const updateData: any = {
      currentDay,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (completed !== undefined) {
      updateData.completed = completed
      if (completed) {
        updateData.completedAt = FieldValue.serverTimestamp()
      }
    }

    await db.collection(COLLECTIONS.readingPlanProgress).doc(id).update(updateData)
    return this.findById(id) as Promise<ReadingPlanProgress>
  }
}

