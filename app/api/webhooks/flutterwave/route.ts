import { NextResponse } from 'next/server'
import { PaymentService } from '@/lib/services/payment-service'
import { GivingService } from '@/lib/services/giving-service'
import { EmailService } from '@/lib/services/email-service'
import { db, FieldValue } from '@/lib/firestore'
import { ReceiptService } from '@/lib/services/receipt-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const signature = request.headers.get('verif-hash')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature (Flutterwave uses verif-hash header)
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH

    if (!secretHash) {
      console.error('Flutterwave webhook received but FLUTTERWAVE_SECRET_HASH is not configured')
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

      // Verify payment
      const verification = await PaymentService.verifyPayment(transactionId)

      if (verification.success && verification.transactionId) {
        // Create giving record
        if (metadata.userId && metadata.type) {
          try {
            const giving = await GivingService.create({
              userId: metadata.userId,
              amount: verification.amount || data.amount,
              type: metadata.type,
              projectId: metadata.projectId || undefined,
              paymentMethod: 'Card',
              transactionId: verification.transactionId,
              notes: metadata.notes || undefined,
            })

            // Send donation receipt email
            const { UserService } = await import('@/lib/services/user-service')
            const { ProjectService } = await import('@/lib/services/giving-service')
            const user = await UserService.findById(metadata.userId)
            
            if (user) {
              let project = null
              if (metadata.projectId) {
                project = await ProjectService.findById(metadata.projectId)
              }

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
                console.error('Error generating donation receipt (webhook):', error)
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
            console.error('Error creating giving record or sending email:', error)
            // Don't fail webhook - payment is already successful
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






