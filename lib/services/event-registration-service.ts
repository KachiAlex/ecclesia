import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export interface EventRegistration {
  id: string
  userId: string
  eventId: string
  ticketNumber: string
  qrCode: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface EventAttendance {
  id: string
  userId: string
  eventId: string
  checkedInAt: Date
}

export class EventRegistrationService {
  static async findById(id: string): Promise<EventRegistration | null> {
    const doc = await db.collection(COLLECTIONS.eventRegistrations).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as EventRegistration
  }

  static async findByUserAndEvent(userId: string, eventId: string): Promise<EventRegistration | null> {
    const snapshot = await db.collection(COLLECTIONS.eventRegistrations)
      .where('userId', '==', userId)
      .where('eventId', '==', eventId)
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
    } as EventRegistration
  }

  static async findByQrCode(eventId: string, qrCode: string): Promise<EventRegistration | null> {
    const snapshot = await db.collection(COLLECTIONS.eventRegistrations)
      .where('eventId', '==', eventId)
      .where('qrCode', '==', qrCode)
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
    } as EventRegistration
  }

  static async create(data: Omit<EventRegistration, 'id' | 'createdAt' | 'updatedAt'>): Promise<EventRegistration> {
    const registrationData = {
      ...data,
      status: 'Registered',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.eventRegistrations).doc()
    await docRef.set(registrationData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as EventRegistration
  }

  static async updateStatus(id: string, status: string): Promise<EventRegistration> {
    await db.collection(COLLECTIONS.eventRegistrations).doc(id).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return this.findById(id) as Promise<EventRegistration>
  }

  static async countByEvent(eventId: string): Promise<number> {
    const snapshot = await db.collection(COLLECTIONS.eventRegistrations)
      .where('eventId', '==', eventId)
      .count()
      .get()

    return snapshot.data().count || 0
  }

  static async listByEvent(eventId: string): Promise<EventRegistration[]> {
    const snapshot = await db
      .collection(COLLECTIONS.eventRegistrations)
      .where('eventId', '==', eventId)
      .get()

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as EventRegistration
    })
  }
}

export class EventAttendanceService {
  static async create(data: Omit<EventAttendance, 'id' | 'checkedInAt'>): Promise<EventAttendance> {
    const attendanceData = {
      ...data,
      checkedInAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.eventAttendances).doc()
    await docRef.set(attendanceData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      checkedInAt: toDate(createdData.checkedInAt),
    } as EventAttendance
  }

  static async findByUserAndEvent(userId: string, eventId: string): Promise<EventAttendance | null> {
    const snapshot = await db.collection(COLLECTIONS.eventAttendances)
      .where('userId', '==', userId)
      .where('eventId', '==', eventId)
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      checkedInAt: toDate(data.checkedInAt),
    } as EventAttendance
  }

  static async countByEvent(eventId: string): Promise<number> {
    const snapshot = await db.collection(COLLECTIONS.eventAttendances)
      .where('eventId', '==', eventId)
      .count()
      .get()

    return snapshot.data().count || 0
  }
}

