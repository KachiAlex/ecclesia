import { NextResponse } from 'next/server'
import { ChurchService } from '@/lib/services/church-service'
import { DEFAULT_TENANT_BRAND } from '@/lib/branding/constants'

export const dynamic = 'force-dynamic'

const sanitizeHost = (host?: string | null) => {
  if (!host) return null
  return host.split(':')[0].toLowerCase()
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const slugParam = url.searchParams.get('slug')?.toLowerCase()?.trim() || null
  const idParam = url.searchParams.get('id')?.trim() || null
  const host = sanitizeHost(request.headers.get('host'))

  try {
    let tenant = null

    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      tenant = await ChurchService.findByCustomDomain(host)
    }

    if (!tenant && idParam) {
      tenant = await ChurchService.findById(idParam)
    }

    if (!tenant && slugParam) {
      tenant = await ChurchService.findBySlug(slugParam)
    }

    if (!tenant) {
      return NextResponse.json({ brand: DEFAULT_TENANT_BRAND })
    }

    const brand = {
      ...DEFAULT_TENANT_BRAND,
      id: tenant.id,
      name: tenant.name ?? DEFAULT_TENANT_BRAND.name,
      tagline: tenant.tagline ?? DEFAULT_TENANT_BRAND.tagline,
      logo: tenant.logo ?? DEFAULT_TENANT_BRAND.logo,
      primaryColor: tenant.primaryColor ?? DEFAULT_TENANT_BRAND.primaryColor,
      secondaryColor: tenant.secondaryColor ?? DEFAULT_TENANT_BRAND.secondaryColor,
      accentColor: tenant.accentColor ?? DEFAULT_TENANT_BRAND.accentColor,
      brandFont: tenant.brandFont ?? DEFAULT_TENANT_BRAND.brandFont,
      customDomain: tenant.customDomain ?? null,
    }

    return NextResponse.json({ brand })
  } catch (error) {
    console.error('tenant.brand.lookup_error', error)
    return NextResponse.json({ brand: DEFAULT_TENANT_BRAND })
  }
}
