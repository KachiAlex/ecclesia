import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { PlatformConnectionService } from '@/lib/services/platform-connection-service'
import { StreamingPlatform } from '@/lib/types/streaming'

export const runtime = 'nodejs'

const isStreamingPlatform = (value: any): value is StreamingPlatform => {
  return Object.values(StreamingPlatform).includes(value)
}

export async function GET() {
  const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PASTOR'] })
  if (!guarded.ok) return guarded.response

  const { church } = guarded.ctx

  const connections = await PlatformConnectionService.getConnections(church.id)
  return NextResponse.json({ connections })
}

export async function POST(request: NextRequest) {
  const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PASTOR'] })
  if (!guarded.ok) return guarded.response

  const { church } = guarded.ctx

  const body = await request.json()
  const platform = body?.platform
  const credentials = body?.credentials
  const expiresAtRaw = body?.expiresAt

  if (!isStreamingPlatform(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  if (!credentials || typeof credentials !== 'object') {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
  }

  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : undefined
  if (expiresAtRaw && Number.isNaN(expiresAt?.getTime())) {
    return NextResponse.json({ error: 'Invalid expiresAt' }, { status: 400 })
  }

  try {
    const connection = await PlatformConnectionService.createConnection(church.id, platform, credentials, expiresAt)
    return NextResponse.json({ connection })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to save connection'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PASTOR'] })
  if (!guarded.ok) return guarded.response

  const { church } = guarded.ctx

  const body = await request.json().catch(() => null)
  const platform = body?.platform

  if (!isStreamingPlatform(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  await PlatformConnectionService.disconnectPlatform(church.id, platform)
  return NextResponse.json({ success: true })
}
