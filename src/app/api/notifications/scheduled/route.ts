/**
 * API Route: Scheduled Notifications - List & Create
 * GET: Fetch scheduled notifications
 * POST: Create a new scheduled notification
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { ScheduledNotificationService } from '@/lib/scheduled-notifications/service'
import { ScheduledNotificationCreateInput } from '@/lib/scheduled-notifications/types'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const churchId = req.nextUrl.searchParams.get('churchId')
    const status = req.nextUrl.searchParams.get('status')

    if (!churchId) {
      return NextResponse.json({ error: 'churchId is required' }, { status: 400 })
    }

    const notifications = await ScheduledNotificationService.getScheduledNotifications(churchId, {
      status: status || undefined,
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching scheduled notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { churchId, ...input } = body

    if (!churchId) {
      return NextResponse.json({ error: 'churchId is required' }, { status: 400 })
    }

    const createInput: ScheduledNotificationCreateInput = {
      recipientEmails: input.recipientEmails,
      title: input.title,
      description: input.description,
      scheduleConfig: input.scheduleConfig,
      digestConfig: input.digestConfig,
    }

    const notification = await ScheduledNotificationService.createScheduledNotification(
      churchId,
      session.user?.id || 'unknown',
      createInput
    )

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('Error creating scheduled notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
