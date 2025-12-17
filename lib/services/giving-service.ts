import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export interface Giving {
  id: string
  userId: string
  amount: number
  type: string
  projectId?: string
  paymentMethod?: string
  transactionId?: string
  notes?: string
  receiptUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  churchId: string
  name: string
  description?: string
  currency?: string
  goalAmount: number
  currentAmount: number
  imageUrl?: string
  startDate?: Date
  endDate?: Date
  status: string
  createdAt: Date
  updatedAt: Date
}

export class GivingService {
  static async findById(id: string): Promise<Giving | null> {
    const doc = await db.collection(COLLECTIONS.giving).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Giving
  }

  static async update(id: string, data: Partial<Giving>): Promise<Giving> {
    const updateData: any = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    }

    delete updateData.id
    delete updateData.createdAt
    delete updateData.updatedAt

    await db.collection(COLLECTIONS.giving).doc(id).update(updateData)
    return this.findById(id) as Promise<Giving>
  }

  static async create(data: Omit<Giving, 'id' | 'createdAt' | 'updatedAt'>): Promise<Giving> {
    const givingData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.giving).doc()
    await docRef.set(givingData)

    // Update project current amount if project-based giving
    if (data.projectId) {
      await ProjectService.incrementAmount(data.projectId, data.amount)
    }

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as Giving
  }

  static async findByUser(userId: string, limit: number = 50): Promise<Giving[]> {
    // Simplified query to avoid composite index requirement
    const snapshot = await db.collection(COLLECTIONS.giving)
      .where('userId', '==', userId)
      .limit(limit)
      .get()

    const results = snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Giving
    })

    // Sort in memory since we can't use orderBy without indexes
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  static async getTotalByUser(userId: string): Promise<number> {
    const snapshot = await db.collection(COLLECTIONS.giving)
      .where('userId', '==', userId)
      .get()

    return snapshot.docs.reduce((sum: number, doc: any) => {
      return sum + (doc.data().amount || 0)
    }, 0)
  }

  static async getGivingStreak(userId: string): Promise<number> {
    const allGiving = await this.findByUser(userId, 1000)
    
    if (allGiving.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let checkDate = new Date(today)
    let streak = 0

    for (const giving of allGiving) {
      const givingDate = new Date(giving.createdAt)
      givingDate.setHours(0, 0, 0, 0)

      if (givingDate.getTime() === checkDate.getTime()) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else if (givingDate.getTime() < checkDate.getTime()) {
        break
      }
    }

    return streak
  }
}

export class ProjectService {
  static async findById(id: string): Promise<Project | null> {
    const doc = await db.collection(COLLECTIONS.projects).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate ? toDate(data.startDate) : undefined,
      endDate: data.endDate ? toDate(data.endDate) : undefined,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Project
  }

  static async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount'>): Promise<Project> {
    const projectData = {
      ...data,
      currentAmount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.projects).doc()
    await docRef.set(projectData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      startDate: createdData.startDate ? toDate(createdData.startDate) : undefined,
      endDate: createdData.endDate ? toDate(createdData.endDate) : undefined,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as Project
  }

  static async findByChurch(churchId: string): Promise<Project[]> {
    // Simplified query to avoid composite index requirement
    // Note: orderBy removed temporarily. Once Firestore indexes are created, add back:
    // .orderBy('createdAt', 'desc')
    const snapshot = await db.collection(COLLECTIONS.projects)
      .where('churchId', '==', churchId)
      .where('status', '==', 'Active')
      .get()

    const results = snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate ? toDate(data.startDate) : undefined,
        endDate: data.endDate ? toDate(data.endDate) : undefined,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Project
    })

    // Sort in memory since we can't use orderBy without indexes
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  static async incrementAmount(projectId: string, amount: number): Promise<void> {
    await db.collection(COLLECTIONS.projects).doc(projectId).update({
      currentAmount: FieldValue.increment(amount),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
}

