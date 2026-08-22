import { google } from 'googleapis'
import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export type ChurchGoogleTokens = {
  id: string
  churchId: string
  accessToken?: string
  refreshToken?: string
  scope?: string
  tokenType?: string
  expiryDate?: number
  calendarId?: string
  connectedByUserId: string
  createdAt: Date
  updatedAt: Date
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing ${name}`)
  return v
}

export function getGoogleOAuthClient() {
  const clientId = requireEnv('GOOGLE_CLIENT_ID')
  const clientSecret = requireEnv('GOOGLE_CLIENT_SECRET')
  const redirectUri = requireEnv('GOOGLE_REDIRECT_URI')

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export class ChurchGoogleService {
  static async getTokensByChurchId(churchId: string): Promise<ChurchGoogleTokens | null> {
    const doc = await db.collection(COLLECTIONS.churchGoogleTokens).doc(churchId).get()
    if (!doc.exists) return null
    const data = doc.data()!

    return {
      id: doc.id,
      churchId: data.churchId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      scope: data.scope,
      tokenType: data.tokenType,
      expiryDate: data.expiryDate,
      calendarId: data.calendarId,
      connectedByUserId: data.connectedByUserId,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    }
  }

  static async upsertTokens(params: {
    churchId: string
    connectedByUserId: string
    accessToken?: string
    refreshToken?: string
    scope?: string
    tokenType?: string
    expiryDate?: number
    calendarId?: string
  }): Promise<ChurchGoogleTokens> {
    const ref = db.collection(COLLECTIONS.churchGoogleTokens).doc(params.churchId)

    const existing = await ref.get()

    const payload: any = {
      churchId: params.churchId,
      connectedByUserId: params.connectedByUserId,
      accessToken: params.accessToken,
      scope: params.scope,
      tokenType: params.tokenType,
      expiryDate: params.expiryDate,
      calendarId: params.calendarId,
      updatedAt: FieldValue.serverTimestamp(),
    }

    // Only overwrite refreshToken if we got one.
    if (params.refreshToken) payload.refreshToken = params.refreshToken

    if (existing.exists) {
      await ref.update(payload)
    } else {
      await ref.set({
        ...payload,
        refreshToken: params.refreshToken,
        createdAt: FieldValue.serverTimestamp(),
      })
    }

    const updated = await ref.get()
    const data = updated.data()!

    return {
      id: updated.id,
      churchId: data.churchId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      scope: data.scope,
      tokenType: data.tokenType,
      expiryDate: data.expiryDate,
      calendarId: data.calendarId,
      connectedByUserId: data.connectedByUserId,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    }
  }

  static async getAuthorizedCalendarClient(churchId: string) {
    const tokens = await this.getTokensByChurchId(churchId)
    if (!tokens?.refreshToken) return null

    const oauth = getGoogleOAuthClient()
    oauth.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.expiryDate,
    })

    // googleapis will auto-refresh when needed.
    const calendar = google.calendar({ version: 'v3', auth: oauth })

    return {
      calendar,
      oauth,
      tokens,
    }
  }
}
