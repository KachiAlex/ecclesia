export type TenantBrand = {
  id?: string | null
  name: string
  tagline: string
  logo: string
  primaryColor: string
  secondaryColor: string
  accentColor?: string
  brandFont?: string
  customDomain?: string | null
}

export const DEFAULT_TENANT_BRAND: TenantBrand = {
  name: 'Pisairtel CMS',
  tagline: 'Modern Church Management & Discipleship Platform',
  logo: '/favicon.svg',
  primaryColor: '#e31e24',
  secondaryColor: '#15161a',
  accentColor: '#faf9f5',
  id: null,
  customDomain: null,
}
