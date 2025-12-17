import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue, Query } from 'firebase-admin/firestore'

export type AttendanceSessionType = 'SERVICE' | 'MEETING'
export type AttendanceMode = 'OFFLINE' | 'ONLINE' | 'HYBRID'
export type AttendanceChannel = 'OFFLINE' | 'ONLINE'

export interface AttendanceSession {
  id: string
  churchId: string
  branchId?: string
  title: string
  type: AttendanceSessionType
  mode: AttendanceMode
  startAt: Date
  endAt?: Date
  location?: string
  notes?: string
  headcount?: {
    total?: number
    men?: number
    women?: number
    children?: number
    firstTimers?: number
  }
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface AttendanceRecord {
  id: string
  churchId: string
  branchId?: string
  sessionId: string
  userId?: string
  guestName?: string
  channel: AttendanceChannel
  checkedInAt: Date
}

export class AttendanceService {
  static async findSessionById(id: string): Promise<AttendanceSession | null> {
    const doc = await db.collection(COLLECTIONS.attendanceSessions).doc(id).get()
    if (!doc.exists) return null
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      startAt: toDate(data.startAt),
      endAt: data.endAt ? toDate(data.endAt) : undefined,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as AttendanceSession
  }

  static async createSession(
    data: Omit<AttendanceSession, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AttendanceSession> {
    const sessionData: any = {
      ...data,
      startAt: data.startAt instanceof Date ? data.startAt : new Date(data.startAt),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (data.endAt) {
      sessionData.endAt = data.endAt instanceof Date ? data.endAt : new Date(data.endAt)
    }

    const docRef = db.collection(COLLECTIONS.attendanceSessions).doc()
    await docRef.set(sessionData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      startAt: toDate(createdData.startAt),
      endAt: createdData.endAt ? toDate(createdData.endAt) : undefined,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as AttendanceSession
  }

  static async listSessionsByChurch(
    churchId: string,
    options?: {
      branchId?: string | null
      startAt?: Date
      endAt?: Date
      limit?: number
    }
  ): Promise<AttendanceSession[]> {
    let query: Query = db.collection(COLLECTIONS.attendanceSessions).where('churchId', '==', churchId)

    if (options?.branchId) {
      query = query.where('branchId', '==', options.branchId)
    }

    if (options?.startAt) {
      query = query.where('startAt', '>=', options.startAt)
    }

    query = query.orderBy('startAt', 'desc').limit(options?.limit || 100)

    const snapshot = await query.get()
    let sessions = snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        startAt: toDate(data.startAt),
        endAt: data.endAt ? toDate(data.endAt) : undefined,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as AttendanceSession
    })

    if (options?.endAt) {
      sessions = sessions.filter((s) => s.startAt <= options.endAt!)
    }

    return sessions
  }

  static async upsertHeadcount(
    sessionId: string,
    headcount: NonNullable<AttendanceSession['headcount']>
  ): Promise<AttendanceSession> {
    await db.collection(COLLECTIONS.attendanceSessions).doc(sessionId).update({
      headcount,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return this.findSessionById(sessionId) as Promise<AttendanceSession>
  }

  static async findRecordBySessionAndUser(sessionId: string, userId: string): Promise<AttendanceRecord | null> {
    const snapshot = await db.collection(COLLECTIONS.attendanceRecords)
      .where('sessionId', '==', sessionId)
      .where('userId', '==', userId)
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      checkedInAt: toDate(data.checkedInAt),
    } as AttendanceRecord
  }

  static async checkIn(
    data: Omit<AttendanceRecord, 'id' | 'checkedInAt'>
  ): Promise<AttendanceRecord> {
    const recordData = {
      ...data,
      checkedInAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.attendanceRecords).doc()
    await docRef.set(recordData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      checkedInAt: toDate(createdData.checkedInAt),
    } as AttendanceRecord
  }

  static async listRecordsBySession(sessionId: string, limit: number = 500): Promise<AttendanceRecord[]> {
    const snapshot = await db.collection(COLLECTIONS.attendanceRecords)
      .where('sessionId', '==', sessionId)
      .limit(limit)
      .get()

    const records = snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        checkedInAt: toDate(data.checkedInAt),
      } as AttendanceRecord
    })

    return records.sort((a, b) => b.checkedInAt.getTime() - a.checkedInAt.getTime())
  }

  static async countRecordsBySession(sessionId: string): Promise<number> {
    const snapshot = await db.collection(COLLECTIONS.attendanceRecords)
      .where('sessionId', '==', sessionId)
      .count()
      .get()

    return snapshot.data().count || 0
  }
}
