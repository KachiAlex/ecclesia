/**
 * Payment Service
 * Supports Flutterwave (Nigeria/Africa/Global)
 * Flutterwave supports 150+ countries and 34 currencies
 */

interface PaymentIntentOptions {
  amount: number // Amount in actual currency unit (not smallest unit)
  currency?: string
  email: string
  name?: string
  phone?: string
  metadata?: Record<string, any>
  reference?: string
}

interface PaymentVerificationResult {
  success: boolean
  transactionId?: string
  amount?: number
  currency?: string
  status?: string
  error?: string
}

export class PaymentService {
  private static provider: 'flutterwave' | null = null

  /**
   * Initialize payment service based on available environment variables
   */
  static initialize() {
    if (process.env.FLUTTERWAVE_SECRET_KEY) {
      this.provider = 'flutterwave'
    } else {
      this.provider = null
      console.warn('No payment gateway configured. Payment functionality will be disabled.')
    }
  }

  /**
   * Initialize payment (create payment intent/transaction)
   */
  static async initializePayment(
    options: PaymentIntentOptions
  ): Promise<{ success: boolean; authorizationUrl?: string; reference?: string; error?: string }> {
    // Initialize if not done
    if (this.provider === null) {
      this.initialize()
    }

    if (!this.provider) {
      return {
        success: false,
        error: 'Payment gateway not configured',
      }
    }

    try {
      return await this.initializeFlutterwavePayment(options)
    } catch (error: any) {
      console.error('Error initializing payment:', error)
      return {
        success: false,
        error: error.message || 'Failed to initialize payment',
      }
    }
  }

  /**
   * Verify payment (after webhook or callback)
   */
  static async verifyPayment(transactionId: string): Promise<PaymentVerificationResult> {
    if (this.provider === null) {
      this.initialize()
    }

    if (!this.provider) {
      return {
        success: false,
        error: 'Payment gateway not configured',
      }
    }

    try {
      return await this.verifyFlutterwavePayment(transactionId)
    } catch (error: any) {
      console.error('Error verifying payment:', error)
      return {
        success: false,
        error: error.message || 'Failed to verify payment',
      }
    }
  }

  /**
   * Initialize Flutterwave payment
   */
  private static async initializeFlutterwavePayment(
    options: PaymentIntentOptions
  ): Promise<{ success: boolean; authorizationUrl?: string; reference?: string; error?: string }> {
    try {
      const Flutterwave = (await import('flutterwave-node-v3')).default
      const flw = new Flutterwave(
        process.env.FLUTTERWAVE_PUBLIC_KEY!,
        process.env.FLUTTERWAVE_SECRET_KEY!
      )

      const reference = options.reference || `ecclesia_${Date.now()}_${Math.random().toString(36).substring(7)}`

      const payload = {
        tx_ref: reference,
        amount: options.amount, // Flutterwave uses actual amount, not smallest unit
        currency: options.currency || 'NGN',
        redirect_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/payments/callback`,
        payment_options: 'card,banktransfer,ussd',
        customer: {
          email: options.email,
          name: options.name || 'Church Member',
          phonenumber: options.phone || '',
        },
        customizations: {
          title: 'Ecclesia Church Donation',
          description: 'Church donation payment',
          logo: '',
        },
        meta: options.metadata || {},
      }

      const response = await flw.PaymentLink.create(payload)

      if (response.status === 'success') {
        return {
          success: true,
          authorizationUrl: response.data.link,
          reference: reference,
        }
      } else {
        throw new Error(response.message || 'Failed to initialize payment')
      }
    } catch (error: any) {
      throw new Error(`Flutterwave error: ${error.message}`)
    }
  }

  /**
   * Verify Flutterwave payment
   */
  private static async verifyFlutterwavePayment(transactionId: string): Promise<PaymentVerificationResult> {
    try {
      const Flutterwave = (await import('flutterwave-node-v3')).default
      const flw = new Flutterwave(
        process.env.FLUTTERWAVE_PUBLIC_KEY!,
        process.env.FLUTTERWAVE_SECRET_KEY!
      )

      const response = await flw.Transaction.verify({ id: transactionId })

      if (response.status !== 'success') {
        return {
          success: false,
          error: response.message || 'Payment verification failed',
        }
      }

      const transaction = response.data

      return {
        success: transaction.status === 'successful',
        transactionId: transaction.tx_ref,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
      }
    } catch (error: any) {
      throw new Error(`Flutterwave verification error: ${error.message}`)
    }
  }
}


