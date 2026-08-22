
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UnitInviteService } from '@/lib/services/unit-service'

export async function GET() {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church, userId } = guarded.ctx
  const invites = await UnitInviteService.findPendingByUser(church!.id, userId)
  return NextResponse.json({ invites })
}
