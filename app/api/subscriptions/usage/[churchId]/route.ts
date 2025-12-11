import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getChurchUsage, getPlanLimits } from '@/lib/subscription'
import { ChurchService } from '@/lib/services/church-service'
import { SubscriptionService, SubscriptionPlanService } from '@/lib/services/subscription-service'

export async function GET(
  request: Request,
  { params }: { params: { churchId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { churchId } = params

    // Get church with subscription
    const church = await ChurchService.findById(churchId)

    if (!church) {
      return NextResponse.json(
        { error: 'Church not found' },
        { status: 404 }
      )
    }

    const subscription = await SubscriptionService.findByChurch(churchId)
    const usage = await getChurchUsage(churchId)
    const limits = subscription
      ? await getPlanLimits(subscription.planId)
      : {}

    const plan = subscription ? await SubscriptionPlanService.findById(subscription.planId) : null

    return NextResponse.json({
      usage,
      limits,
      plan,
    })
  } catch (error) {
    console.error('Error fetching usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

