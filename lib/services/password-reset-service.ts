import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'
import crypto from 'crypto'

export interface PasswordResetToken {
  id: string
  userId: string
  token: string
  expiresAt: Date
  used: boolean
  createdAt: Date
}

export class PasswordResetService {
  /**
   * Generate a secure random token
   */
  private static generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Create a password reset token for a user
   */
  static async createToken(userId: string): Promise<PasswordResetToken> {
    // Invalidate any existing unused tokens for this user
    const existingTokens = await db.collection(COLLECTIONS.passwordResetTokens)
      .where('userId', '==', userId)
      .where('used', '==', false)
      .get()

    const batch = db.batch()
    existingTokens.docs.forEach((doc) => {
      batch.update(doc.ref, { used: true })
    })
    await batch.commit()

    // Create new token (expires in 1 hour)
    const token = this.generateToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    const tokenData = {
      userId,
      token,
      expiresAt,
      used: false,
      createdAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.passwordResetTokens).doc()
    await docRef.set(tokenData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      expiresAt: toDate(createdData.expiresAt),
      createdAt: toDate(createdData.createdAt),
    } as PasswordResetToken
  }

  /**
   * Validate and get token
   */
  static async validateToken(token: string): Promise<PasswordResetToken | null> {
    const snapshot = await db.collection(COLLECTIONS.passwordResetTokens)
      .where('token', '==', token)
      .where('used', '==', false)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    const data = doc.data()
    const tokenData = {
      id: doc.id,
      ...data,
      expiresAt: toDate(data.expiresAt),
      createdAt: toDate(data.createdAt),
    } as PasswordResetToken

    // Check if expired
    if (tokenData.expiresAt < new Date()) {
      return null
    }

    return tokenData
  }

  /**
   * Mark token as used
   */
  static async markAsUsed(tokenId: string): Promise<void> {
    await db.collection(COLLECTIONS.passwordResetTokens)
      .doc(tokenId)
      .update({ used: true })
  }

  /**
   * Clean up expired tokens (can be run as a scheduled job)
   */
  static async cleanupExpiredTokens(): Promise<void> {
    const now = new Date()
    const snapshot = await db.collection(COLLECTIONS.passwordResetTokens)
      .where('expiresAt', '<', now)
      .get()

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    await batch.commit()
  }
}

