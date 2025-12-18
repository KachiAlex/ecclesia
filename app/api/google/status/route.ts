import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { ChurchGoogleService } from '@/lib/services/church-google-service'

export async function GET() {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church } = guarded.ctx
  const tokens = await ChurchGoogleService.getTokensByChurchId(church.id)

  const connected = !!tokens?.refreshToken

  return NextResponse.json({
    connected,
    calendarId: tokens?.calendarId || null,
    connectedByUserId: tokens?.connectedByUserId || null,
    updatedAt: tokens?.updatedAt || null,
  })
}
