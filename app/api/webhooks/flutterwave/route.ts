import { NextResponse } from 'next/server'
import { PaymentService } from '@/lib/services/payment-service'
import { GivingService } from '@/lib/services/giving-service'
import { EmailService } from '@/lib/services/email-service'

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
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH || process.env.FLUTTERWAVE_SECRET_KEY!

    if (signature !== secretHash) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = body.event
    const data = body.data

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

              await EmailService.sendDonationReceipt(
                user.email,
                {
                  amount: verification.amount || data.amount,
                  type: metadata.type,
                  projectName: project?.name,
                  transactionId: verification.transactionId,
                  date: new Date(giving.createdAt),
                  receiptUrl: undefined, // Will be added when PDF generation is implemented
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






