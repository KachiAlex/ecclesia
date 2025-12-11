import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export interface ChildrenCheckIn {
  id: string
  childId: string
  parentId: string
  qrCode: string
  checkedInAt: Date
  checkedOutAt?: Date
  createdAt: Date
}

export class ChildrenCheckInService {
  static async findActiveByChild(childId: string): Promise<ChildrenCheckIn | null> {
    const snapshot = await db.collection(COLLECTIONS.childrenCheckIns)
      .where('childId', '==', childId)
      .where('checkedOutAt', '==', null)
      .orderBy('checkedInAt', 'desc')
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      checkedInAt: toDate(data.checkedInAt),
      checkedOutAt: data.checkedOutAt ? toDate(data.checkedOutAt) : undefined,
      createdAt: toDate(data.createdAt),
    } as ChildrenCheckIn
  }

  static async findByChild(childId: string): Promise<ChildrenCheckIn[]> {
    const snapshot = await db.collection(COLLECTIONS.childrenCheckIns)
      .where('childId', '==', childId)
      .orderBy('checkedInAt', 'desc')
      .get()

    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        checkedInAt: toDate(data.checkedInAt),
        checkedOutAt: data.checkedOutAt ? toDate(data.checkedOutAt) : undefined,
        createdAt: toDate(data.createdAt),
      } as ChildrenCheckIn
    })
  }

  static async create(data: Omit<ChildrenCheckIn, 'id' | 'checkedInAt' | 'createdAt'>): Promise<ChildrenCheckIn> {
    const checkInData = {
      ...data,
      checkedInAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.childrenCheckIns).doc()
    await docRef.set(checkInData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      checkedInAt: toDate(createdData.checkedInAt),
      createdAt: toDate(createdData.createdAt),
    } as ChildrenCheckIn
  }

  static async checkout(id: string): Promise<ChildrenCheckIn> {
    await db.collection(COLLECTIONS.childrenCheckIns).doc(id).update({
      checkedOutAt: FieldValue.serverTimestamp(),
    })

    const updated = await db.collection(COLLECTIONS.childrenCheckIns).doc(id).get()
    const data = updated.data()!
    return {
      id: updated.id,
      ...data,
      checkedInAt: toDate(data.checkedInAt),
      checkedOutAt: data.checkedOutAt ? toDate(data.checkedOutAt) : undefined,
      createdAt: toDate(data.createdAt),
    } as ChildrenCheckIn
  }
}

