
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { LivestreamService } from '@/lib/services/livestream-service'
import { StreamingPlatform } from '@/lib/types/streaming'

const isValidPlatform = (v: any): v is StreamingPlatform =>
  Object.values(StreamingPlatform).includes(v as StreamingPlatform)

export async function GET() {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church } = guarded.ctx
  const config = await LivestreamService.findByChurch(church.id)
  return NextResponse.json(config)
}

export async function POST(request: Request) {
  const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PASTOR'] })
  if (!guarded.ok) return guarded.response

  const { church } = guarded.ctx
  const body = await request.json()

  const enabled = !!body.enabled
  const platform = body.platform
  const url = (body.url || '').trim()

  if (!isValidPlatform(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  if (enabled && !url) {
    return NextResponse.json({ error: 'Stream URL is required when enabled' }, { status: 400 })
  }

  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : undefined
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: 'Invalid scheduledAt' }, { status: 400 })
  }

  const updated = await LivestreamService.upsertByChurch(church.id, {
    enabled,
    platform,
    url,
    title: body.title || undefined,
    description: body.description || undefined,
    scheduledAt,
  })

  return NextResponse.json(updated)
}
