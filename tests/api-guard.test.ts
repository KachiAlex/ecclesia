import { describe, expect, it, vi } from 'vitest'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => null),
}))

vi.mock('@/lib/church-context', () => ({
  getCurrentChurch: vi.fn(async () => null),
}))

describe('guardApi', () => {
  it('returns 401 when no session', async () => {
    const { guardApi } = await import('@/lib/api-guard')

    const result = await guardApi({ requireChurch: false })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
    }
  })
})
