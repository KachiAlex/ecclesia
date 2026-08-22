import { NextRequest, NextResponse } from 'next/server'
import { getCurrentChurchId } from '@/lib/church-context'
import { isSubscriptionActive, checkUsageLimit } from '@/lib/subscription'

/**
 * Middleware wrapper to check subscription status before allowing access
 */
export async function withSubscription(
  request: NextRequest,
  handler: (req: NextRequest, churchId: string) => Promise<NextResponse>,
  userId?: string
) {
  const churchId = await getCurrentChurchId(userId)

  if (!churchId) {
    return NextResponse.json(
      { error: 'No church selected' },
      { status: 400 }
    )
  }

  const active = await isSubscriptionActive(churchId)
  if (!active) {
    return NextResponse.json(
      {
        error: 'Subscription expired or inactive',
        message: 'Please renew your subscription to continue using this feature.',
      },
      { status: 403 }
    )
  }

  return handler(request, churchId)
}

/**
 * Check specific usage limit before proceeding
 */
export async function withUsageLimit(
  churchId: string,
  limitType: 'maxUsers' | 'maxSermons' | 'maxEvents' | 'maxStorageGB' | 'maxDepartments' | 'maxGroups'
): Promise<{ allowed: boolean; error?: NextResponse }> {
  const limitCheck = await checkUsageLimit(churchId, limitType)

  if (!limitCheck.allowed) {
    return {
      allowed: false,
      error: NextResponse.json(
        {
          error: 'Usage limit reached',
          limit: limitCheck.limit,
          current: limitCheck.current,
          message: `You have reached your ${limitType} limit. Please upgrade your plan.`,
        },
        { status: 403 }
      ),
    }
  }

  return { allowed: true }
}

