import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export interface Group {
  id: string
  churchId: string
  departmentId?: string
  name: string
  description?: string
  latitude?: number
  longitude?: number
  createdAt: Date
  updatedAt: Date
}

export interface GroupMembership {
  id: string
  userId: string
  groupId: string
  role: string
  joinedAt: Date
}

export class GroupService {
  static async findByChurch(churchId: string): Promise<Group[]> {
    const snapshot = await db.collection(COLLECTIONS.groups)
      .where('churchId', '==', churchId)
      .get()

    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Group
    })
  }
}

export class GroupMembershipService {
  static async findByUserAndGroup(userId: string, groupId: string): Promise<GroupMembership | null> {
    const snapshot = await db.collection(COLLECTIONS.groupMemberships)
      .where('userId', '==', userId)
      .where('groupId', '==', groupId)
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      joinedAt: toDate(data.joinedAt),
    } as GroupMembership
  }
}
