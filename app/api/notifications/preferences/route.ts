import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'

// In-memory preferences store (replace with database in production)
const preferencesStore = new Map<string, any>()

const defaultPreferences = {
  userId: '',
  enableEmailNotifications: true,
  enableInAppNotifications: true,
  enableThresholdAlerts: true,
  enableExportNotifications: true,
  emailDigestFrequency: 'daily' as const,
  channels: {
    email: true,
    inApp: true,
    push: false,
  },
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
  },
}

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const preferences = preferencesStore.get(userId) || { ...defaultPreferences, userId }

    return NextResponse.json({
      success: true,
      preferences,
    })
  } catch (error) {
    console.error('Get preferences error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get preferences' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications/preferences
 * Update user's notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()

    // Get current preferences or default
    const current = preferencesStore.get(userId) || { ...defaultPreferences, userId }

    // Merge with updates
    const updated = {
      ...current,
      ...body,
      channels: { ...current.channels, ...body.channels },
      quietHours: { ...current.quietHours, ...body.quietHours },
    }

    // Store updated preferences
    preferencesStore.set(userId, updated)

    return NextResponse.json({
      success: true,
      preferences: updated,
    })
  } catch (error) {
    console.error('Update preferences error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
