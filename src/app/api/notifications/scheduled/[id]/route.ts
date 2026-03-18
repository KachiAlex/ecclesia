/**
 * API Route: Scheduled Notification - Get, Update, Delete
 * GET: Fetch a specific scheduled notification
 * PATCH: Update a scheduled notification
 * DELETE: Delete a scheduled notification
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { ScheduledNotificationService } from '@/lib/scheduled-notifications/service'
import { ScheduledNotificationUpdateInput } from '@/lib/scheduled-notifications/types'
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

    const notification = await ScheduledNotificationService.getScheduledNotification(params.id)

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error fetching scheduled notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const updates: ScheduledNotificationUpdateInput = {
      recipientEmails: body.recipientEmails,
      title: body.title,
      description: body.description,
      scheduleConfig: body.scheduleConfig,
      digestConfig: body.digestConfig,
      status: body.status,
    }

    await ScheduledNotificationService.updateScheduledNotification(params.id, updates)

    const updated = await ScheduledNotificationService.getScheduledNotification(params.id)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating scheduled notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ScheduledNotificationService.deleteScheduledNotification(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting scheduled notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
