declare module 'flutterwave-node-v3' {
  interface FlutterwaveConfig {
    publicKey: string
    secretKey: string
  }

  interface PaymentLinkPayload {
    tx_ref: string
    amount: number
    currency: string
    redirect_url: string
    payment_options?: string
    customer: {
      email: string
      name: string
      phonenumber: string
    }
    customizations: {
      title: string
      description: string
      logo: string
    }
    meta?: Record<string, any>
  }

  interface PaymentLinkResponse {
    status: string
    message: string
    data: {
      link: string
    }
  }

  interface TransactionVerifyResponse {
    status: string
    message: string
    data: {
      id: number
      tx_ref: string
      flw_ref: string
      amount: number
      currency: string
      status: string
      customer: {
        email: string
        name: string
      }
      created_at: string
    }
  }

  class Flutterwave {
    constructor(publicKey: string, secretKey: string)
    
    PaymentLink: {
      create(payload: PaymentLinkPayload): Promise<PaymentLinkResponse>
    }
    
    Transaction: {
      verify(params: { id: string }): Promise<TransactionVerifyResponse>
    }
  }

  export default Flutterwave
}

