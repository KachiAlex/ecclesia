
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { AttendanceService } from '@/lib/services/attendance-service'
import { UserService } from '@/lib/services/user-service'

export async function PUT(request: Request, { params }: { params: { sessionId: string } }) {
  const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'BRANCH_ADMIN', 'PASTOR', 'LEADER'] })
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
  const headcount = body?.headcount
  if (!headcount || typeof headcount !== 'object') {
    return NextResponse.json({ error: 'headcount is required' }, { status: 400 })
  }

  const updated = await AttendanceService.upsertHeadcount(session.id, headcount)
  return NextResponse.json({ session: updated })
}
