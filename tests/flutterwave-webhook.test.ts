import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/firestore', () => {
  const store = new Map<string, any>()
  const collection = vi.fn(() => ({
    doc: vi.fn((id: string) => {
      const docStore = store.get(id)
      return {
        get: vi.fn(async () => ({ exists: store.has(id) })),
        set: vi.fn(async (data: any) => {
          store.set(id, data)
        }),
        update: vi.fn(async (data: any) => {
          store.set(id, { ...(store.get(id) ?? {}), ...data })
        }),
      }
    }),
  }))

  return {
    db: {
      collection,
    },
    FieldValue: {
      serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
    },
    __test: {
      reset: () => store.clear(),
    },
  }
})

const mockVerifyPayment = vi.fn()
vi.mock('@/lib/services/payment-service', () => ({
  PaymentService: {
    verifyPayment: mockVerifyPayment,
  },
}))

vi.mock('@/lib/services/giving-service', () => ({
  GivingService: {
    create: vi.fn(async () => ({ id: 'giving_1', createdAt: new Date() })),
  },
}))

vi.mock('@/lib/services/email-service', () => ({
  EmailService: {
    sendDonationReceipt: vi.fn(async () => undefined),
  },
}))

vi.mock('@/lib/services/receipt-service', () => ({
  ReceiptService: {
    generateUploadAndAttachDonationReceipt: vi.fn(async () => 'https://example.com/receipt.pdf'),
  },
}))

const mockGetCurrentChurch = vi.fn()
vi.mock('@/lib/church-context', () => ({
  getCurrentChurch: mockGetCurrentChurch,
}))

const mockFindGivingConfig = vi.fn()
vi.mock('@/lib/services/giving-config-service', () => ({
  GivingConfigService: {
    findByChurch: mockFindGivingConfig,
  },
}))

vi.mock('@/lib/services/subscription-payment-service', () => ({
  SubscriptionPaymentService: {
    findByReference: vi.fn(async () => null),
    markPaid: vi.fn(async () => undefined),
    markFailed: vi.fn(async () => undefined),
    markApplied: vi.fn(async () => undefined),
  },
}))

vi.mock('@/lib/services/subscription-service', () => ({
  SubscriptionService: {
    findByChurch: vi.fn(async () => ({ id: 'sub_1' })),
  },
  SubscriptionPlanService: {
    findById: vi.fn(async () => ({ id: 'plan_1' })),
  },
}))

vi.mock('@/lib/logger', () => ({
  getCorrelationIdFromRequest: () => 'test-correlation',
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  mockVerifyPayment.mockResolvedValue({ success: true, transactionId: 'txn_123', amount: 10, currency: 'NGN' })
  mockGetCurrentChurch.mockResolvedValue(null)
  mockFindGivingConfig.mockResolvedValue(null)
})

describe('Flutterwave webhook', () => {
  it('returns 400 when signature is missing', async () => {
    const { POST } = await import('@/app/api/webhooks/flutterwave/route')

    const req = new Request('http://localhost/api/webhooks/flutterwave', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ event: 'charge.completed', data: {} }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('calls PaymentService.verifyPayment when signature is valid', async () => {
    const secret = 'test_secret_hash'
    process.env.FLUTTERWAVE_SECRET_HASH = secret

    const { __test } = await import('@/lib/firestore') as any
    __test.reset()

    const { PaymentService } = await import('@/lib/services/payment-service') as any
    ;(PaymentService.verifyPayment as any).mockClear()

    const { POST } = await import('@/app/api/webhooks/flutterwave/route')

    const payload = {
      event: 'charge.completed',
      data: {
        id: 98765,
        tx_ref: 'tx_ref_sig_1',
        status: 'successful',
        amount: 10,
        meta: {},
      },
    }

    const req = new Request('http://localhost/api/webhooks/flutterwave', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'verif-hash': secret,
      },
      body: JSON.stringify(payload),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.received).toBe(true)

    expect(PaymentService.verifyPayment).toHaveBeenCalledTimes(1)
    expect(PaymentService.verifyPayment).toHaveBeenCalledWith(98765, undefined)
  })

  it('returns duplicate on second delivery for same transaction id', async () => {
    const secret = 'test_secret_hash'
    process.env.FLUTTERWAVE_SECRET_HASH = secret

    const { __test } = await import('@/lib/firestore') as any
    __test.reset()

    const { POST } = await import('@/app/api/webhooks/flutterwave/route')

    const payload = {
      event: 'charge.completed',
      data: {
        id: 12345,
        tx_ref: 'tx_ref_1',
        status: 'successful',
        amount: 10,
        meta: {},
      },
    }

    const req1 = new Request('http://localhost/api/webhooks/flutterwave', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'verif-hash': secret,
      },
      body: JSON.stringify(payload),
    })

    const res1 = await POST(req1)
    expect(res1.status).toBe(200)
    const json1 = await res1.json()
    expect(json1.received).toBe(true)
    expect(json1.duplicate).toBeUndefined()

    const req2 = new Request('http://localhost/api/webhooks/flutterwave', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'verif-hash': secret,
      },
      body: JSON.stringify(payload),
    })

    const res2 = await POST(req2)
    expect(res2.status).toBe(200)
    const json2 = await res2.json()
    expect(json2.received).toBe(true)
    expect(json2.duplicate).toBe(true)
  })
})
