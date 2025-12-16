import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { PaymentService } from '@/lib/services/payment-service'
import { UserService } from '@/lib/services/user-service'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
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






