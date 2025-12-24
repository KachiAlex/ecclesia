
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { AttendanceService } from '@/lib/services/attendance-service'
import { UserService } from '@/lib/services/user-service'

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church, userId, role } = guarded.ctx
  const user = await UserService.findById(userId)

  const session = await AttendanceService.findSessionById(params.sessionId)
  if (!session || session.churchId !== church.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (role === 'BRANCH_ADMIN') {
    const myBranch = (user as any)?.branchId || null
    if (session.branchId && myBranch && session.branchId !== myBranch) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const body = await request.json()
  const targetUserId = body?.userId || userId
  const channel = body?.channel || 'OFFLINE'
  const guestName = body?.guestName

  if (targetUserId) {
    const existing = await AttendanceService.findRecordBySessionAndUser(session.id, targetUserId)
    if (existing) {
      return NextResponse.json({ error: 'Already checked in', record: existing }, { status: 400 })
    }
  }

  const created = await AttendanceService.checkIn({
    churchId: church.id,
    branchId: session.branchId || undefined,
    sessionId: session.id,
    userId: targetUserId || undefined,
    guestName: guestName || undefined,
    channel,
  })

  return NextResponse.json({ record: created }, { status: 201 })
}
