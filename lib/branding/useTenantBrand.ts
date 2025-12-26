'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_TENANT_BRAND, TenantBrand } from './constants'

type UseTenantBrandOptions = {
  slug?: string | null
  churchId?: string | null
}

type TenantBrandResponse = {
  brand: TenantBrand
}

export function useTenantBrand(options?: UseTenantBrandOptions) {
  const [brand, setBrand] = useState<TenantBrand>(DEFAULT_TENANT_BRAND)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function loadBrand() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (options?.slug) params.set('slug', options.slug)
        if (options?.churchId) params.set('id', options.churchId)

        const endpoint = params.toString() ? `/api/tenant/brand?${params.toString()}` : '/api/tenant/brand'
        const response = await fetch(endpoint, {
          cache: 'no-store',
          signal: controller.signal,
        })

        const data = (await response.json()) as TenantBrandResponse
        if (!cancelled && data?.brand) {
          setBrand({
            ...DEFAULT_TENANT_BRAND,
            ...data.brand,
          })
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        console.error('tenant.brand.fetch_error', err)
        if (!cancelled) {
          setError(err?.message ?? 'Unable to load branding.')
          setBrand(DEFAULT_TENANT_BRAND)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadBrand()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [options?.slug, options?.churchId])

  return { brand, loading, error }
}
