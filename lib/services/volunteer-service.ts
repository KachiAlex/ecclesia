import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { Query } from 'firebase-admin/firestore'
import { FieldValue } from 'firebase-admin/firestore'

export interface VolunteerShift {
  id: string
  userId: string
  departmentId?: string
  role: string
  startTime: Date
  endTime?: Date
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  departmentId?: string
  dueDate?: Date
  priority: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export class VolunteerShiftService {
  static async findByChurch(churchId: string, startDate?: Date, endDate?: Date): Promise<VolunteerShift[]> {
    // Get all users in church
    const usersSnapshot = await db.collection(COLLECTIONS.users)
      .where('churchId', '==', churchId)
      .get()
    const userIds = usersSnapshot.docs.map((doc: any) => doc.id)

    if (userIds.length === 0) return []

    // Get shifts for these users
    let allShifts: VolunteerShift[] = []
    for (const userId of userIds) {
      let query: Query = db.collection(COLLECTIONS.volunteerShifts)
        .where('userId', '==', userId)
      
      if (startDate) {
        query = query.where('startTime', '>=', startDate)
      }
      if (endDate) {
        query = query.where('startTime', '<=', endDate)
      }

      const snapshot = await query.orderBy('startTime', 'asc').get()
      const shifts = snapshot.docs.map((doc: any) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          startTime: toDate(data.startTime),
          endTime: data.endTime ? toDate(data.endTime) : undefined,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as VolunteerShift
      })
      allShifts.push(...shifts)
    }

    return allShifts.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  static async create(data: Omit<VolunteerShift, 'id' | 'createdAt' | 'updatedAt'>): Promise<VolunteerShift> {
    const shiftData = {
      ...data,
      startTime: data.startTime instanceof Date ? data.startTime : new Date(data.startTime),
      endTime: data.endTime ? (data.endTime instanceof Date ? data.endTime : new Date(data.endTime)) : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.volunteerShifts).doc()
    await docRef.set(shiftData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      startTime: toDate(createdData.startTime),
      endTime: createdData.endTime ? toDate(createdData.endTime) : undefined,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as VolunteerShift
  }
}

export class TaskService {
  static async findByChurch(churchId: string, status?: string, userId?: string): Promise<Task[]> {
    // Get all users in church
    const usersSnapshot = await db.collection(COLLECTIONS.users)
      .where('churchId', '==', churchId)
      .get()
    const userIds = userId ? [userId] : usersSnapshot.docs.map((doc: any) => doc.id)

    if (userIds.length === 0) return []

    // Get tasks for these users
    let allTasks: Task[] = []
    for (const userId of userIds) {
      let query: Query = db.collection(COLLECTIONS.tasks)
        .where('userId', '==', userId)
      
      if (status) {
        query = query.where('status', '==', status)
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get()
      const tasks = snapshot.docs.map((doc: any) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          dueDate: data.dueDate ? toDate(data.dueDate) : undefined,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as Task
      })
      allTasks.push(...tasks)
    }

    return allTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  static async create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const taskData = {
      ...data,
      dueDate: data.dueDate ? (data.dueDate instanceof Date ? data.dueDate : new Date(data.dueDate)) : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.tasks).doc()
    await docRef.set(taskData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      dueDate: createdData.dueDate ? toDate(createdData.dueDate) : undefined,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as Task
  }
}

