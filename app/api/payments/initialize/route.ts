import { NextResponse } from 'next/server'
import { PaymentService } from '@/lib/services/payment-service'
import { UserService } from '@/lib/services/user-service'
import { guardApi } from '@/lib/api-guard'

export async function POST(request: Request) {
  try {
    const guarded = await guardApi()
    if (!guarded.ok) return guarded.response

    const { userId } = guarded.ctx
    const user = await UserService.findById(userId)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { amount, currency, type, projectId, notes } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    // Initialize payment
    const result = await PaymentService.initializePayment({
      amount: amount, // Flutterwave uses actual amount, not smallest unit
      currency: currency || 'NGN',
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      phone: user.phone || '',
      metadata: {
        userId,
        type,
        projectId: projectId || null,
        notes: notes || null,
      },
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to initialize payment' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
    })
  } catch (error: any) {
    console.error('Error initializing payment:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}






