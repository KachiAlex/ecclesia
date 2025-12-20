import { NextResponse } from 'next/server'
import { ChurchService } from '@/lib/services/church-service'
import { SubscriptionService, SubscriptionPlanService } from '@/lib/services/subscription-service'
import { db, FieldValue } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { guardApi } from '@/lib/api-guard'
import { getPlanConfig, recommendPlan } from '@/lib/licensing/plans'

export const dynamic = 'force-dynamic'

// GET - Get church details with subscription info
export async function GET(
  request: Request,
  { params }: { params: Promise<{ churchId: string }> }
) {
  try {
    const { churchId } = await params
    const guarded = await guardApi({ allowedRoles: ['SUPER_ADMIN'] })
    if (!guarded.ok) return guarded.response

    const church = await ChurchService.findById(churchId)

    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 })
    }

    // Get subscription
    const subscription = await SubscriptionService.findByChurch(churchId)
    let plan = null
    if (subscription?.planId) {
      plan = await SubscriptionPlanService.findById(subscription.planId)
    }
    const availablePlans = await SubscriptionPlanService.findAll()

    // Get user count
    const usersSnapshot = await db.collection(COLLECTIONS.users)
      .where('churchId', '==', churchId)
      .get()
    const userCount = usersSnapshot.size

    const serializeDate = (value: any) => {
      if (!value) return value
      if (value instanceof Date) return value.toISOString()
      if (typeof value.toDate === 'function') return value.toDate().toISOString()
      return value
    }

    const churchForClient = church
      ? {
          ...church,
          createdAt: serializeDate(church.createdAt),
          updatedAt: serializeDate(church.updatedAt),
        }
      : null

    const subscriptionForClient = subscription
      ? {
          ...subscription,
          startDate: serializeDate(subscription.startDate),
          endDate: serializeDate(subscription.endDate),
          trialEndsAt: serializeDate(subscription.trialEndsAt),
          createdAt: serializeDate(subscription.createdAt),
          updatedAt: serializeDate(subscription.updatedAt),
        }
      : null

    const planForClient = plan
      ? {
          ...plan,
          createdAt: serializeDate(plan.createdAt),
          updatedAt: serializeDate(plan.updatedAt),
        }
      : null

    const plansForClient = availablePlans.map((p) => ({
      ...p,
      createdAt: serializeDate(p.createdAt),
      updatedAt: serializeDate(p.updatedAt),
    }))

    const planMeta = planForClient ? getPlanConfig(planForClient.id) : getPlanConfig(church.preferredPlanId)
    const recommendedPlanMeta = recommendPlan({ memberCount: church.estimatedMembers })

    return NextResponse.json({
      church: churchForClient,
      subscription: subscriptionForClient,
      plan: planForClient,
      availablePlans: plansForClient,
      userCount,
      planMeta,
      recommendedPlanMeta,
    })
  } catch (error) {
    console.error('Error fetching church:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update church or subscription
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ churchId: string }> }
) {
  try {
    const { churchId } = await params
    const guarded = await guardApi({ allowedRoles: ['SUPER_ADMIN'] })
    if (!guarded.ok) return guarded.response
    const body = await request.json()
    const { action, ...data } = body

    const church = await ChurchService.findById(churchId)
    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 })
    }

    // Handle different actions
    switch (action) {
      case 'update_church':
        // Update church details
        const updatedChurch = await ChurchService.update(churchId, data)
        return NextResponse.json({ church: updatedChurch })

      case 'extend_trial':
        // Extend trial period
        const subscription = await SubscriptionService.findByChurch(churchId)
        if (!subscription) {
          return NextResponse.json(
            { error: 'Subscription not found' },
            { status: 404 }
          )
        }

        const daysToAdd = data.days || 30
        const currentEndDate = subscription.trialEndsAt || subscription.endDate || new Date()
        const newEndDate = new Date(currentEndDate)
        newEndDate.setDate(newEndDate.getDate() + daysToAdd)

        await db.collection(COLLECTIONS.subscriptions).doc(subscription.id).update({
          trialEndsAt: newEndDate,
          endDate: newEndDate,
          updatedAt: FieldValue.serverTimestamp(),
        })

        const updatedSub = await SubscriptionService.findByChurch(churchId)
        return NextResponse.json({
          subscription: updatedSub,
          message: `Trial extended by ${daysToAdd} days`,
        })

      case 'change_plan':
        // Change subscription plan
        const { planId } = data
        if (!planId) {
          return NextResponse.json(
            { error: 'Plan ID is required' },
            { status: 400 }
          )
        }

        const plan = await SubscriptionPlanService.findById(planId)
        if (!plan) {
          return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        const currentSub = await SubscriptionService.findByChurch(churchId)
        if (!currentSub) {
          return NextResponse.json(
            { error: 'Subscription not found' },
            { status: 404 }
          )
        }

        // Update plan
        await db.collection(COLLECTIONS.subscriptions).doc(currentSub.id).update({
          planId,
          updatedAt: FieldValue.serverTimestamp(),
        })

        const updatedSubscription = await SubscriptionService.findByChurch(churchId)
        return NextResponse.json({
          subscription: updatedSubscription,
          plan,
          message: 'Plan updated successfully',
        })

      case 'update_status':
        // Update subscription status (ACTIVE, TRIAL, EXPIRED, CANCELLED, SUSPENDED)
        const { status } = data
        if (!status) {
          return NextResponse.json(
            { error: 'Status is required' },
            { status: 400 }
          )
        }

        const sub = await SubscriptionService.findByChurch(churchId)
        if (!sub) {
          return NextResponse.json(
            { error: 'Subscription not found' },
            { status: 404 }
          )
        }

        await db.collection(COLLECTIONS.subscriptions).doc(sub.id).update({
          status,
          updatedAt: FieldValue.serverTimestamp(),
        })

        const updated = await SubscriptionService.findByChurch(churchId)
        return NextResponse.json({
          subscription: updated,
          message: `Subscription status updated to ${status}`,
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Error updating church:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Suspend/delete church (soft delete by suspending subscription)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ churchId: string }> }
) {
  try {
    const { churchId } = await params
    const guarded = await guardApi({ allowedRoles: ['SUPER_ADMIN'] })
    if (!guarded.ok) return guarded.response
    const subscription = await SubscriptionService.findByChurch(churchId)

    if (subscription) {
      // Suspend subscription instead of deleting
      await db.collection(COLLECTIONS.subscriptions).doc(subscription.id).update({
        status: 'SUSPENDED',
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    return NextResponse.json({
      message: 'Church subscription suspended',
    })
  } catch (error) {
    console.error('Error suspending church:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

