import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { SubscriptionService } from '@/lib/services/subscription-service'
import { db, FieldValue } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function POST(
  request: Request,
  { params }: { params: { churchId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any)?.role
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { churchId } = params
    const subscription = await SubscriptionService.findByChurch(churchId)

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Activate subscription
    await db.collection(COLLECTIONS.subscriptions).doc(subscription.id).update({
      status: 'ACTIVE',
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updated = await SubscriptionService.findByChurch(churchId)

    return NextResponse.json({
      subscription: updated,
      message: 'Church activated successfully',
    })
  } catch (error: any) {
    console.error('Error activating church:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

