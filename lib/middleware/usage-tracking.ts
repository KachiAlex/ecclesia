import { NextRequest, NextResponse } from 'next/server'
import { incrementUsage, checkUsageLimit, isSubscriptionActive } from '@/lib/subscription'

/**
 * Middleware to track API usage and enforce limits
 */
export async function trackUsage(
  request: NextRequest,
  churchId: string | null,
  action: 'api_call' | 'ai_coaching' | 'sermon_upload' | 'event_create' | 'user_create'
) {
  if (!churchId) {
    return NextResponse.json(
      { error: 'Church ID required' },
      { status: 400 }
    )
  }

  // Check if subscription is active
  const active = await isSubscriptionActive(churchId)
  if (!active) {
    return NextResponse.json(
      { error: 'Subscription expired or inactive' },
      { status: 403 }
    )
  }

  // Check limits based on action
  let limitCheck: { allowed: boolean; current: number; limit?: number } | null = null

  switch (action) {
    case 'user_create':
      limitCheck = await checkUsageLimit(churchId, 'maxUsers')
      break
    case 'sermon_upload':
      limitCheck = await checkUsageLimit(churchId, 'maxSermons')
      break
    case 'event_create':
      limitCheck = await checkUsageLimit(churchId, 'maxEvents')
      break
    default:
      // API calls and AI coaching don't have hard limits, just tracking
      break
  }

  if (limitCheck && !limitCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Usage limit reached',
        limit: limitCheck.limit,
        current: limitCheck.current,
      },
      { status: 403 }
    )
  }

  // Track usage
  switch (action) {
    case 'api_call':
      await incrementUsage(churchId, 'apiCalls')
      break
    case 'ai_coaching':
      await incrementUsage(churchId, 'aiCoachingSessions')
      break
    case 'user_create':
      await incrementUsage(churchId, 'userCount')
      break
    case 'sermon_upload':
      await incrementUsage(churchId, 'sermonsCount')
      break
    case 'event_create':
      await incrementUsage(churchId, 'eventsCount')
      break
  }

  return null // No error, continue
}

/**
 * Get usage headers for response
 */
export async function getUsageHeaders(churchId: string) {
  const { checkUsageLimit, getChurchUsage } = await import('@/lib/subscription')
  const usage = await getChurchUsage(churchId)

  // Check all limits
  const limits = {
    users: await checkUsageLimit(churchId, 'maxUsers'),
    sermons: await checkUsageLimit(churchId, 'maxSermons'),
    events: await checkUsageLimit(churchId, 'maxEvents'),
    storage: await checkUsageLimit(churchId, 'maxStorageGB'),
  }

  return {
    'X-Usage-Users': `${usage.userCount}/${limits.users.limit || 'unlimited'}`,
    'X-Usage-Sermons': `${usage.sermonsCount}/${limits.sermons.limit || 'unlimited'}`,
    'X-Usage-Events': `${usage.eventsCount}/${limits.events.limit || 'unlimited'}`,
    'X-Usage-Storage': `${usage.storageUsedGB.toFixed(2)}/${limits.storage.limit || 'unlimited'}GB`,
    'X-Usage-API-Calls': usage.apiCalls.toString(),
  }
}

