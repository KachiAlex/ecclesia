export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { EventReminderService } from '@/lib/services/event-reminder-service'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (!['ADMIN', 'SUPER_ADMIN', 'PASTOR', 'LEADER'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { limit } = await request.json().catch(() => ({ limit: 25 }))
    const parsedLimit = Number(limit) > 0 ? Number(limit) : 25

    const result = await EventReminderService.sendDueReminders(parsedLimit)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error dispatching reminders:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
