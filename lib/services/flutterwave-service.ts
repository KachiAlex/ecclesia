/**
 * Flutterwave Payment Service
 * Handles payment processing for donations
 */

export interface FlutterwaveInitiateResponse {
  status: string
  message: string
  data?: {
    link: string
  }
}

export interface FlutterwaveWebhookPayload {
  event: string
  data: {
    id: number
    txRef: string
    flwRef: string
    deviceFingerprint: string
    amount: number
    currency: string
    chargedAmount: number
    appFee: number
    merchantFee: number
    processorFee: number
    authModel: string
    ip: string
    narration: string
    status: string
    paymentType: string
    createdAt: string
    accountId: number
    customer: {
      id: number
      phone: string
      fullName: string
      customerEmail: string
      createdAt: string
    }
    paymentPlan: any
    subaccounts: any[]
    card: {
      issuer: string
      country: string
      number: string
      type: string
      expiry: string
    }
    meta: Record<string, any>
  }
}

export class FlutterwaveService {
  private static API_BASE = 'https://api.flutterwave.com/v3'
  private static SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY

  /**
   * Initiate payment - returns link to redirect user to payment page
   */
  static async initiatePayment(payload: {
    amount: number
    email: string
    phone?: string
    fullName: string
    currency?: string
    txRef: string
    redirectUrl: string
    meta?: Record<string, any>
  }): Promise<{ success: boolean; link?: string; error?: string }> {
    try {
      if (!this.SECRET_KEY) {
        throw new Error('FLUTTERWAVE_SECRET_KEY not configured')
      }

      const response = await fetch(`${this.API_BASE}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.SECRET_KEY}`,
        },
        body: JSON.stringify({
          tx_ref: payload.txRef,
          amount: payload.amount,
          currency: payload.currency || 'USD',
          redirect_url: payload.redirectUrl,
          payment_options: 'card,account,ussd,bank_transfer,mobilemoneyghana,mobilemoneyzambia,mobilemoneytriple,momo_uganda',
          customer: {
            email: payload.email,
            phonenumber: payload.phone,
            name: payload.fullName,
          },
          customizations: {
            title: 'Ecclesia Donation',
            description: 'Church Donation',
            logo: 'https://ecclesia-church.com/logo.png',
          },
          meta: payload.meta || {},
        }),
      })

      const data = (await response.json()) as FlutterwaveInitiateResponse

      if (data.status === 'success' && data.data?.link) {
        return {
          success: true,
          link: data.data.link,
        }
      }

      return {
        success: false,
        error: data.message || 'Failed to initiate payment',
      }
    } catch (error: any) {
      console.error('Flutterwave payment initiation error:', error)
      return {
        success: false,
        error: error.message || 'Payment initiation failed',
      }
    }
  }

  /**
   * Verify payment after redirect from Flutterwave
   */
  static async verifyPayment(transactionId: string): Promise<{ 
    success: boolean
    data?: FlutterwaveWebhookPayload['data']
    error?: string 
  }> {
    try {
      if (!this.SECRET_KEY) {
        throw new Error('FLUTTERWAVE_SECRET_KEY not configured')
      }

      const response = await fetch(
        `${this.API_BASE}/transactions/${transactionId}/verify`,
        {
          headers: {
            Authorization: `Bearer ${this.SECRET_KEY}`,
          },
        }
      )

      const data = (await response.json()) as any

      if (data.status === 'success' && data.data?.status === 'successful') {
        return {
          success: true,
          data: data.data,
        }
      }

      return {
        success: false,
        error: data.message || 'Payment verification failed',
      }
    } catch (error: any) {
      console.error('Flutterwave verification error:', error)
      return {
        success: false,
        error: error.message || 'Payment verification failed',
      }
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    body: string,
    signature: string
  ): boolean {
    try {
      if (!this.SECRET_KEY) {
        return false
      }

      const crypto = require('crypto')
      const hash = crypto
        .createHmac('sha256', this.SECRET_KEY)
        .update(body)
        .digest('hex')

      return hash === signature
    } catch (error) {
      console.error('Webhook signature verification error:', error)
      return false
    }
  }

  /**
   * Create unique transaction reference
   */
  static generateTransactionRef(): string {
    return `ecclesia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
