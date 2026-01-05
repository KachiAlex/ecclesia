import { cookies } from 'next/headers'
import { ChurchService } from './services/church-service'
import { UserService } from './services/user-service'
import { db, isFirebaseConfigured } from './firestore'
import { COLLECTIONS } from './firestore-collections'
import { logger } from '@/lib/logger'

const CHURCH_COOKIE_NAME = 'ecclesia_church_id'

/**
 * Get the current church ID from cookies or user's default church
 */
export async function getCurrentChurchId(userId?: string): Promise<string | null> {
  const cookieStore = await cookies()
  const churchIdFromCookie = cookieStore.get(CHURCH_COOKIE_NAME)?.value

  if (churchIdFromCookie) {
    // Verify church exists
    const church = await ChurchService.findById(churchIdFromCookie)
    if (church) {
      logger.info('tenant.current_church.from_cookie', { userId, churchId: churchIdFromCookie })
      return churchIdFromCookie
    }
  }

  // If no cookie or invalid, try user's default church
  if (userId) {
    const user = await UserService.findById(userId)
    if (user?.churchId) {
      logger.info('tenant.current_church.from_user_default', { userId, churchId: user.churchId })
      return user.churchId
    }
  }

  return null
}

/**
 * Set the current church ID in cookies
 */
export async function setCurrentChurchId(churchId: string) {
  const cookieStore = await cookies()
  cookieStore.set(CHURCH_COOKIE_NAME, churchId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

/**
 * Get current church with subscription info
 */
const serialize = <T>(value: T): T => {
  if (value === null || value === undefined) {
    return value
  }
  return JSON.parse(JSON.stringify(value))
}

export async function getCurrentChurch(userId?: string) {
  const churchId = await getCurrentChurchId(userId)
  if (!churchId) {
    return null
  }

  const church = await ChurchService.findById(churchId)
  if (!church) return null

  if (!isFirebaseConfigured()) {
    return serialize({
      ...church,
      subscription: null,
    })
  }

  try {
    // Get subscription if exists
    const subscriptionSnapshot = await db
      .collection(COLLECTIONS.subscriptions)
      .where('churchId', '==', churchId)
      .limit(1)
      .get()

    let subscription = null
    if (!subscriptionSnapshot.empty) {
      const subData = subscriptionSnapshot.docs[0].data()
      const planDoc = await db.collection(COLLECTIONS.subscriptionPlans).doc(subData.planId).get()

      subscription = {
        ...subData,
        plan: planDoc.exists ? planDoc.data() : null,
      }
    }

    return serialize({
      ...church,
      subscription,
    })
  } catch (error) {
    logger.error('tenant.current_church.subscription_fetch_failed', { error })
    return serialize({
      ...church,
      subscription: null,
    })
  }
}

