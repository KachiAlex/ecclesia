import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { AIAssistantService } from '@/lib/services/ai-assistant-service'
import { getCurrentChurchId } from '@/lib/church-context'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const churchId = await getCurrentChurchId(userId)

    if (!churchId) {
      return NextResponse.json({ error: 'No church found' }, { status: 404 })
    }

    const notifications = await AIAssistantService.getChurchNotifications(churchId, 20)

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId, action } = body

    if (!notificationId || !action) {
      return NextResponse.json({ error: 'Missing notificationId or action' }, { status: 400 })
    }

    if (action === 'dismiss') {
      await AIAssistantService.dismissNotification(notificationId)
    } else if (action === 'act') {
      await AIAssistantService.actOnNotification(notificationId)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
