import { NextResponse } from 'next/server'
import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { ChurchGoogleService, getGoogleOAuthClient } from '@/lib/services/church-google-service'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(new URL('/meetings?google=error', url.origin))
  }

  const stateRef = db.collection(COLLECTIONS.churchGoogleOauthStates).doc(state)
  const stateDoc = await stateRef.get()

  if (!stateDoc.exists) {
    return NextResponse.redirect(new URL('/meetings?google=expired', url.origin))
  }

  const stateData = stateDoc.data()!
  const expiresAt = stateData.expiresAt ? toDate(stateData.expiresAt) : null
  if (expiresAt && expiresAt.getTime() < Date.now()) {
    await stateRef.delete().catch(() => null)
    return NextResponse.redirect(new URL('/meetings?google=expired', url.origin))
  }

  const churchId = String(stateData.churchId || '')
  const connectedByUserId = String(stateData.userId || '')

  const oauth = getGoogleOAuthClient()
  const tokenResponse = await oauth.getToken(code)
  const tokens = tokenResponse.tokens

  await ChurchGoogleService.upsertTokens({
    churchId,
    connectedByUserId,
    accessToken: tokens.access_token || undefined,
    refreshToken: tokens.refresh_token || undefined,
    scope: tokens.scope || undefined,
    tokenType: tokens.token_type || undefined,
    expiryDate: tokens.expiry_date || undefined,
    calendarId: 'primary',
  })

  await stateRef.delete().catch(() => null)

  return NextResponse.redirect(new URL('/meetings?google=connected', url.origin))
}
