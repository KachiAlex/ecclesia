/**
 * API Route: Scheduled Notification Runs - History
 * GET: Fetch execution history for a scheduled notification
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { ScheduledNotificationService } from '@/lib/scheduled-notifications/service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const runs = await ScheduledNotificationService.getScheduledNotificationRuns(params.id)

    return NextResponse.json(runs)
  } catch (error) {
    console.error('Error fetching notification runs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
