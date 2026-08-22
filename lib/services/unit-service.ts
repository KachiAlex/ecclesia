import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export interface Unit {
  id: string
  churchId: string
  unitTypeId: string
  name: string
  description?: string
  headUserId: string
  branchId?: string
  permissions?: {
    invitePolicy?: 'HEAD_ONLY' | 'ANY_MEMBER'
  }
  createdAt: Date
  updatedAt: Date
}

export type UnitMembershipRole = 'HEAD' | 'MEMBER'

export interface UnitMembership {
  id: string
  churchId: string
  unitId: string
  unitTypeId: string
  userId: string
  role: UnitMembershipRole
  createdAt: Date
}

export type UnitInviteStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'DECLINED'

export interface UnitInvite {
  id: string
  churchId: string
  unitId: string
  unitTypeId: string
  invitedUserId: string
  invitedByUserId: string
  status: UnitInviteStatus
  createdAt: Date
  respondedAt?: Date
}

export class UnitService {
  static async create(data: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Unit> {
    const payload = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }
    const ref = db.collection(COLLECTIONS.units).doc()
    await ref.set(payload)
    return (await this.findById(ref.id)) as Unit
  }

  static async findById(id: string): Promise<Unit | null> {
    const doc = await db.collection(COLLECTIONS.units).doc(id).get()
    if (!doc.exists) return null
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Unit
  }

  static async findByChurch(churchId: string, limit: number = 200): Promise<Unit[]> {
    const snap = await db.collection(COLLECTIONS.units).where('churchId', '==', churchId).limit(limit).get()
    return snap.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Unit
    })
  }

  static async findByUnitType(churchId: string, unitTypeId: string, limit: number = 200): Promise<Unit[]> {
    const snap = await db
      .collection(COLLECTIONS.units)
      .where('churchId', '==', churchId)
      .where('unitTypeId', '==', unitTypeId)
      .limit(limit)
      .get()

    return snap.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Unit
    })
  }

  static async update(
    id: string,
    patch: Partial<Pick<Unit, 'name' | 'description' | 'headUserId' | 'branchId' | 'permissions'>>
  ): Promise<Unit> {
    await db.collection(COLLECTIONS.units).doc(id).update({
      ...patch,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return (await this.findById(id)) as Unit
  }
}

export class UnitMembershipService {
  static async findByUserAndUnit(userId: string, unitId: string): Promise<UnitMembership | null> {
    const snap = await db
      .collection(COLLECTIONS.unitMemberships)
      .where('userId', '==', userId)
      .where('unitId', '==', unitId)
      .limit(1)
      .get()

    if (snap.empty) return null
    const doc = snap.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
    } as UnitMembership
  }

  static async findByUserAndUnitType(userId: string, unitTypeId: string, limit: number = 50): Promise<UnitMembership[]> {
    const snap = await db
      .collection(COLLECTIONS.unitMemberships)
      .where('userId', '==', userId)
      .where('unitTypeId', '==', unitTypeId)
      .limit(limit)
      .get()

    return snap.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
      } as UnitMembership
    })
  }

  static async findByUser(userId: string, limit: number = 200): Promise<UnitMembership[]> {
    const snap = await db.collection(COLLECTIONS.unitMemberships).where('userId', '==', userId).limit(limit).get()
    return snap.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
      } as UnitMembership
    })
  }

  static async findByUnit(unitId: string, limit: number = 200): Promise<UnitMembership[]> {
    const snap = await db.collection(COLLECTIONS.unitMemberships).where('unitId', '==', unitId).limit(limit).get()
    return snap.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
      } as UnitMembership
    })
  }

  static async create(data: Omit<UnitMembership, 'id' | 'createdAt'>): Promise<UnitMembership> {
    const payload = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    }
    const ref = db.collection(COLLECTIONS.unitMemberships).doc()
    await ref.set(payload)
    return (await this.findById(ref.id)) as UnitMembership
  }

  static async findById(id: string): Promise<UnitMembership | null> {
    const doc = await db.collection(COLLECTIONS.unitMemberships).doc(id).get()
    if (!doc.exists) return null
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
    } as UnitMembership
  }
}

export class UnitInviteService {
  static async findById(id: string): Promise<UnitInvite | null> {
    const doc = await db.collection(COLLECTIONS.unitInvites).doc(id).get()
    if (!doc.exists) return null
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      respondedAt: data.respondedAt ? toDate(data.respondedAt) : undefined,
    } as UnitInvite
  }

  static async findPendingByUser(churchId: string, userId: string, limit: number = 100): Promise<UnitInvite[]> {
    const snap = await db
      .collection(COLLECTIONS.unitInvites)
      .where('churchId', '==', churchId)
      .where('invitedUserId', '==', userId)
      .where('status', '==', 'PENDING')
      .limit(limit)
      .get()

    return snap.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        respondedAt: data.respondedAt ? toDate(data.respondedAt) : undefined,
      } as UnitInvite
    })
  }

  static async create(data: Omit<UnitInvite, 'id' | 'createdAt' | 'respondedAt' | 'status'>): Promise<UnitInvite> {
    const payload = {
      ...data,
      status: 'PENDING',
      createdAt: FieldValue.serverTimestamp(),
    }
    const ref = db.collection(COLLECTIONS.unitInvites).doc()
    await ref.set(payload)
    return (await this.findById(ref.id)) as UnitInvite
  }

  static async updateStatus(id: string, status: UnitInviteStatus): Promise<UnitInvite> {
    const patch: any = {
      status,
      respondedAt: FieldValue.serverTimestamp(),
    }
    await db.collection(COLLECTIONS.unitInvites).doc(id).update(patch)
    return (await this.findById(id)) as UnitInvite
  }
}
