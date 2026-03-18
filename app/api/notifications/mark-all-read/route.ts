import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { NotificationService } from '@/lib/services/notification-service'

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for a user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()

    if (body.userId && body.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Can only mark your own notifications as read' },
        { status: 403 }
      )
    }

    await NotificationService.markAllAsRead(userId)

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
    })
  } catch (error) {
    console.error('Mark all as read error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to mark all as read' },
      { status: 500 }
    )
  }
}
