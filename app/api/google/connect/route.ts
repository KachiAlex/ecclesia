import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { getGoogleOAuthClient } from '@/lib/services/church-google-service'
import { FieldValue } from 'firebase-admin/firestore'
import crypto from 'crypto'

export async function POST() {
  const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PASTOR'] })
  if (!guarded.ok) return guarded.response

  const { church, userId } = guarded.ctx

  const oauth = getGoogleOAuthClient()

  const state = crypto.randomBytes(24).toString('hex')

  await db.collection(COLLECTIONS.churchGoogleOauthStates).doc(state).set({
    churchId: church.id,
    userId,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  })

  const url = oauth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    state,
  })

  return NextResponse.json({ url })
}
