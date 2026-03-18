/**
 * API Route: Trigger Scheduled Notification
 * POST: Execute a scheduled notification immediately
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { ScheduledNotificationService } from '@/lib/scheduled-notifications/service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const run = await ScheduledNotificationService.executeScheduledNotification(params.id)

    return NextResponse.json({
      success: true,
      run,
      message: `Notification triggered and sent to ${run.sentTo.length} recipient(s)`,
    })
  } catch (error) {
    console.error('Error triggering scheduled notification:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
