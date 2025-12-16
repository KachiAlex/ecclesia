import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { PaymentService } from '@/lib/services/payment-service'
import { GivingService } from '@/lib/services/giving-service'
import { UserService } from '@/lib/services/user-service'
import { EmailService } from '@/lib/services/email-service'

/**
 * Payment Callback Handler
 * Handles redirects from Flutterwave after payment
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transaction_id')
    const txRef = searchParams.get('tx_ref')
    const status = searchParams.get('status')

    // Flutterwave returns transaction_id and tx_ref
    const paymentReference = transactionId || txRef

    if (!paymentReference) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/giving?error=missing_reference`
      )
    }

    // Check if payment was successful from URL params
    if (status !== 'successful' && status !== 'completed') {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/giving?error=payment_failed`
      )
    }

    // Verify payment
    const verification = await PaymentService.verifyPayment(paymentReference)

    if (!verification.success) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/giving?error=verification_failed`
      )
    }

    // Webhook will handle creating the giving record
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/giving?success=true&reference=${paymentReference}`
    )
  } catch (error: any) {
    console.error('Error processing payment callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/giving?error=payment_failed`
    )
  }
}

