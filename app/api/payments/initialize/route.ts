import { NextResponse } from 'next/server'
import { PaymentService } from '@/lib/services/payment-service'
import { UserService } from '@/lib/services/user-service'
import { guardApi } from '@/lib/api-guard'
import { getCorrelationIdFromRequest, logger } from '@/lib/logger'
import { GivingConfigService } from '@/lib/services/giving-config-service'

export async function POST(request: Request) {
  const correlationId = getCorrelationIdFromRequest(request)
  try {
    logger.info('payments.initialize.request', { correlationId })
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { userId, church } = guarded.ctx
    logger.info('payments.initialize.guarded', { correlationId, userId })
    const user = await UserService.findById(userId)

    if (!user) {
      logger.warn('payments.initialize.user_not_found', { correlationId, userId })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { amount, currency, type, projectId, notes } = body

    if (!amount || amount <= 0) {
      logger.warn('payments.initialize.invalid_amount', { correlationId, userId, amount })
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    const givingConfig = await GivingConfigService.findByChurch(church.id)
    const flutterwaveConfig = givingConfig?.paymentMethods?.flutterwave
    const flutterwaveCreds = flutterwaveConfig?.enabled && flutterwaveConfig.publicKey && flutterwaveConfig.secretKey
      ? { publicKey: flutterwaveConfig.publicKey, secretKey: flutterwaveConfig.secretKey }
      : undefined

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
    }, flutterwaveCreds)

    if (!result.success) {
      logger.warn('payments.initialize.failed', { correlationId, userId, error: result.error })
      return NextResponse.json(
        { error: result.error || 'Failed to initialize payment' },
        { status: 400 }
      )
    }

    logger.info('payments.initialize.success', { correlationId, userId, reference: result.reference })

    return NextResponse.json({
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
    })
  } catch (error: any) {
    logger.error('payments.initialize.error', {
      correlationId,
      message: error?.message,
      name: error?.name,
    })
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}






