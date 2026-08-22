import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DEFAULT_TENANT_BRAND } from '@/lib/branding/constants'

const mockFindByCustomDomain = vi.fn()
const mockFindById = vi.fn()
const mockFindBySlug = vi.fn()

vi.mock('@/lib/services/church-service', () => ({
  ChurchService: {
    findByCustomDomain: mockFindByCustomDomain,
    findById: mockFindById,
    findBySlug: mockFindBySlug,
  },
}))

describe('GET /api/tenant/brand', () => {
  beforeEach(() => {
    mockFindByCustomDomain.mockResolvedValue(null)
    mockFindById.mockResolvedValue(null)
    mockFindBySlug.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  const createRequest = (url: string, headers: Record<string, string> = {}) =>
    new Request(url, {
      headers,
    })

  it('returns default brand when no tenant is resolved', async () => {
    const { GET } = await import('@/app/api/tenant/brand/route')

    const response = await GET(createRequest('http://localhost/api/tenant/brand', { host: 'localhost:3000' }))
    const data = await response.json()

    expect(data.brand).toEqual(DEFAULT_TENANT_BRAND)
    expect(mockFindByCustomDomain).not.toHaveBeenCalled()
  })

  it('prefers custom domain when host is not localhost', async () => {
    const sampleTenant = {
      id: 'tenant-1',
      name: 'Grace Chapel',
      tagline: 'A place to belong',
      logo: '/logos/grace.svg',
      primaryColor: '#111111',
      secondaryColor: '#222222',
      accentColor: '#333333',
      brandFont: 'serif',
      customDomain: 'grace.example.com',
    }
    mockFindByCustomDomain.mockResolvedValue(sampleTenant)

    const { GET } = await import('@/app/api/tenant/brand/route')

    const response = await GET(
      createRequest('http://grace.example.com/api/tenant/brand', { host: 'grace.example.com' }),
    )
    const data = await response.json()

    expect(mockFindByCustomDomain).toHaveBeenCalledWith('grace.example.com')
    expect(data.brand).toMatchObject({
      id: sampleTenant.id,
      name: sampleTenant.name,
      logo: sampleTenant.logo,
      tagline: sampleTenant.tagline,
      primaryColor: sampleTenant.primaryColor,
      secondaryColor: sampleTenant.secondaryColor,
      customDomain: sampleTenant.customDomain,
    })
  })

  it('falls back to church id query param when custom domain not found', async () => {
    const tenant = {
      id: 'tenant-by-id',
      name: 'City Church',
    }
    mockFindById.mockResolvedValue(tenant)

    const { GET } = await import('@/app/api/tenant/brand/route')

    const response = await GET(
      createRequest('http://localhost/api/tenant/brand?id=tenant-by-id', { host: 'localhost:3000' }),
    )
    const data = await response.json()

    expect(mockFindById).toHaveBeenCalledWith('tenant-by-id')
    expect(mockFindBySlug).not.toHaveBeenCalled()
    expect(data.brand.name).toBe('City Church')
  })

  it('falls back to slug query param when id is absent', async () => {
    const tenant = {
      id: 'tenant-slug',
      name: 'Harvest Church',
    }
    mockFindBySlug.mockResolvedValue(tenant)

    const { GET } = await import('@/app/api/tenant/brand/route')

    const response = await GET(
      createRequest('http://localhost/api/tenant/brand?slug=harvest-church', { host: 'localhost:3000' }),
    )
    const data = await response.json()

    expect(mockFindBySlug).toHaveBeenCalledWith('harvest-church')
    expect(data.brand.name).toBe('Harvest Church')
  })
})
