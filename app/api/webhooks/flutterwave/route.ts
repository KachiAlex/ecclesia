import { NextResponse } from 'next/server'
import { PaymentService } from '@/lib/services/payment-service'
import { GivingService } from '@/lib/services/giving-service'
import { EmailService } from '@/lib/services/email-service'
import { db, FieldValue } from '@/lib/firestore'
import { ReceiptService } from '@/lib/services/receipt-service'
import { getCorrelationIdFromRequest, logger } from '@/lib/logger'
import { GivingConfigService } from '@/lib/services/giving-config-service'
import { getCurrentChurch } from '@/lib/church-context'

export async function POST(request: Request) {
  const correlationId = getCorrelationIdFromRequest(request)
  try {
    logger.info('webhook.flutterwave.request', { correlationId })
    const body = await request.json()
    const signature = request.headers.get('verif-hash')

    if (!signature) {
      logger.warn('webhook.flutterwave.missing_signature', { correlationId })
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature (Flutterwave uses verif-hash header)
    // Prefer per-church config if available, fallback to env.
    const metadataUserId = body?.data?.meta?.userId
    const church = metadataUserId ? await getCurrentChurch(metadataUserId) : null
    const config = church ? await GivingConfigService.findByChurch(church.id) : null
    const secretHash = config?.paymentMethods?.flutterwave?.webhookSecretHash || process.env.FLUTTERWAVE_SECRET_HASH

    if (!secretHash) {
      logger.error('webhook.flutterwave.missing_secret', { correlationId })
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    const { timingSafeEqual } = await import('crypto')
    const sigOk = (() => {
      try {
        return timingSafeEqual(Buffer.from(signature), Buffer.from(secretHash))
      } catch {
        return false
      }
    })()

    if (!sigOk) {
      logger.warn('webhook.flutterwave.invalid_signature', { correlationId })
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = body.event
    const data = body.data

    // Idempotency: prevent duplicate processing for the same transaction
    // Prefer Flutterwave transaction id; fallback to tx_ref.
    const transactionKey = data?.id ? `flutterwave_${data.id}` : data?.tx_ref ? `flutterwave_txref_${data.tx_ref}` : null
    if (transactionKey) {
      const markerRef = db.collection('webhook_events').doc(transactionKey)
      const markerSnap = await markerRef.get()
      if (markerSnap.exists) {
        logger.info('webhook.flutterwave.duplicate', { correlationId, transactionKey })
        return NextResponse.json({ received: true, duplicate: true })
      }
      await markerRef.set({
        provider: 'flutterwave',
        event,
        tx_ref: data?.tx_ref || null,
        transactionId: data?.id || null,
        status: data?.status || null,
        createdAt: FieldValue.serverTimestamp(),
      })
    }

    // Handle successful payment
    if (event === 'charge.completed' && data.status === 'successful') {
      const transactionId = data.id
      const metadata = data.meta || {}

      logger.info('webhook.flutterwave.charge_completed', { correlationId, transactionId })

      // Verify payment
      const fw = config?.paymentMethods?.flutterwave
      const flutterwaveCreds = fw?.enabled && fw.publicKey && fw.secretKey ? { publicKey: fw.publicKey, secretKey: fw.secretKey } : undefined
      const verification = await PaymentService.verifyPayment(transactionId, flutterwaveCreds)

      logger.info('webhook.flutterwave.verify_done', {
        correlationId,
        transactionId,
        success: verification.success,
      })

      if (verification.success && verification.transactionId) {
        // Create giving record
        if (metadata.userId && metadata.type) {
          try {
            const { UserService } = await import('@/lib/services/user-service')
            const { ProjectService } = await import('@/lib/services/giving-service')
            const user = await UserService.findById(metadata.userId)
            const project = metadata.projectId ? await ProjectService.findById(metadata.projectId) : null

            const giving = await GivingService.create({
              userId: metadata.userId,
              churchId: church?.id || (user as any)?.churchId,
              branchId: (user as any)?.branchId || undefined,
              amount: verification.amount || data.amount,
              currency: verification.currency || project?.currency || undefined,
              type: metadata.type,
              projectId: metadata.projectId || undefined,
              paymentMethod: 'Card',
              transactionId: verification.transactionId,
              notes: metadata.notes || undefined,
            })

            // Send donation receipt email
            if (user) {
              let receiptUrl: string | undefined
              try {
                receiptUrl = await ReceiptService.generateUploadAndAttachDonationReceipt({
                  givingId: giving.id,
                  userId: metadata.userId,
                  userName: `${user.firstName} ${user.lastName}`,
                  userEmail: user.email,
                  amount: verification.amount || data.amount,
                  type: metadata.type,
                  projectName: project?.name,
                  transactionId: verification.transactionId,
                  date: new Date(giving.createdAt),
                })
              } catch (error) {
                logger.error('webhook.flutterwave.receipt_error', {
                  correlationId,
                  transactionId,
                  message: (error as any)?.message,
                  name: (error as any)?.name,
                })
              }

              await EmailService.sendDonationReceipt(
                user.email,
                {
                  amount: verification.amount || data.amount,
                  type: metadata.type,
                  projectName: project?.name,
                  transactionId: verification.transactionId,
                  date: new Date(giving.createdAt),
                  receiptUrl,
                },
                `${user.firstName} ${user.lastName}`
              )
            }
          } catch (error) {
            logger.error('webhook.flutterwave.giving_or_email_error', {
              correlationId,
              transactionId,
              message: (error as any)?.message,
              name: (error as any)?.name,
            })
            // Don't fail webhook - payment is already successful
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    logger.error('webhook.flutterwave.error', {
      correlationId,
      message: error?.message,
      name: error?.name,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






