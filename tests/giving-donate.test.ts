import { describe, expect, it, vi } from 'vitest'

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => null),
}))

vi.mock('@/lib/church-context', () => ({
  getCurrentChurch: vi.fn(async () => ({ id: 'church_1', name: 'Test Church' })),
}))

vi.mock('@/lib/services/giving-service', () => ({
  GivingService: {
    create: vi.fn(async () => ({ id: 'giving_1', createdAt: new Date() })),
  },
  ProjectService: {
    findById: vi.fn(async () => null),
  },
}))

vi.mock('@/lib/services/user-service', () => ({
  UserService: {
    findById: vi.fn(async () => ({ id: 'user_1', email: 'test@example.com', firstName: 'Test', lastName: 'User' })),
  },
}))

vi.mock('@/lib/services/receipt-service', () => ({
  ReceiptService: {
    generateUploadAndAttachDonationReceipt: vi.fn(async () => 'https://example.com/receipt.pdf'),
  },
}))

vi.mock('@/lib/services/email-service', () => ({
  EmailService: {
    sendDonationReceipt: vi.fn(async () => undefined),
  },
}))

describe('Giving donate', () => {
  it('returns 401 when unauthenticated', async () => {
    const { POST } = await import('@/app/api/giving/donate/route')

    const req = new Request('http://localhost/api/giving/donate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ amount: '10', type: 'Tithe' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 201 and receiptUrl when authenticated (happy path)', async () => {
    const { getServerSession } = await import('next-auth/next') as any
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user_1' },
    })

    const { POST } = await import('@/app/api/giving/donate/route')

    const req = new Request('http://localhost/api/giving/donate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ amount: '10', type: 'Tithe', paymentMethod: 'Card' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json).toHaveProperty('id')
    expect(json.receiptUrl).toBeTruthy()
  })
})
