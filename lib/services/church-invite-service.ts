import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'
import crypto from 'crypto'

export type ChurchInviteStatus = 'ACTIVE' | 'REVOKED' | 'USED'

export type ChurchInvitePurpose = 'MEMBER_SIGNUP'

export interface ChurchInvite {
  id: string
  churchId: string
  createdByUserId: string
  purpose: ChurchInvitePurpose
  tokenHash: string
  status: ChurchInviteStatus
  branchId?: string
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
  revokedAt?: Date
  usedAt?: Date
  usedByUserId?: string
}

export function hashInviteToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export class ChurchInviteService {
  static async findById(id: string): Promise<ChurchInvite | null> {
    const doc = await db.collection(COLLECTIONS.churchInvites).doc(id).get()
    if (!doc.exists) return null
    const data = doc.data() as any
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      expiresAt: data.expiresAt ? toDate(data.expiresAt) : undefined,
      revokedAt: data.revokedAt ? toDate(data.revokedAt) : undefined,
      usedAt: data.usedAt ? toDate(data.usedAt) : undefined,
    } as ChurchInvite
  }

  static async findActiveByChurch(churchId: string, purpose: ChurchInvitePurpose): Promise<ChurchInvite | null> {
    const snap = await db
      .collection(COLLECTIONS.churchInvites)
      .where('churchId', '==', churchId)
      .where('purpose', '==', purpose)
      .where('status', '==', 'ACTIVE')
      .limit(1)
      .get()

    if (snap.empty) return null
    const doc = snap.docs[0]
    const data = doc.data() as any
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      expiresAt: data.expiresAt ? toDate(data.expiresAt) : undefined,
      revokedAt: data.revokedAt ? toDate(data.revokedAt) : undefined,
      usedAt: data.usedAt ? toDate(data.usedAt) : undefined,
    } as ChurchInvite
  }

  static async findByTokenHash(tokenHash: string): Promise<ChurchInvite | null> {
    const snap = await db
      .collection(COLLECTIONS.churchInvites)
      .where('tokenHash', '==', tokenHash)
      .limit(1)
      .get()

    if (snap.empty) return null
    const doc = snap.docs[0]
    const data = doc.data() as any
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      expiresAt: data.expiresAt ? toDate(data.expiresAt) : undefined,
      revokedAt: data.revokedAt ? toDate(data.revokedAt) : undefined,
      usedAt: data.usedAt ? toDate(data.usedAt) : undefined,
    } as ChurchInvite
  }

  static async createActive(params: {
    churchId: string
    createdByUserId: string
    purpose: ChurchInvitePurpose
    branchId?: string
    expiresAt?: Date
  }): Promise<{ invite: ChurchInvite; token: string }> {
    const token = generateInviteToken()
    const tokenHash = hashInviteToken(token)

    const payload: any = {
      churchId: params.churchId,
      createdByUserId: params.createdByUserId,
      purpose: params.purpose,
      tokenHash,
      status: 'ACTIVE',
      branchId: params.branchId || null,
      expiresAt: params.expiresAt ? params.expiresAt : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const ref = db.collection(COLLECTIONS.churchInvites).doc()
    await ref.set(payload)

    const created = (await this.findById(ref.id)) as ChurchInvite
    return { invite: created, token }
  }

  static async revoke(id: string): Promise<ChurchInvite> {
    await db.collection(COLLECTIONS.churchInvites).doc(id).update({
      status: 'REVOKED',
      revokedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return (await this.findById(id)) as ChurchInvite
  }

  static async markUsed(id: string, usedByUserId: string): Promise<ChurchInvite> {
    await db.collection(COLLECTIONS.churchInvites).doc(id).update({
      status: 'USED',
      usedByUserId,
      usedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return (await this.findById(id)) as ChurchInvite
  }
}
