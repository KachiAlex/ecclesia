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
  name: 'pi-CMS',
  tagline: 'Church Management',
  logo: '/pi-cms-logo.svg',
  primaryColor: '#0ea5e9',
  secondaryColor: '#6366f1',
  id: null,
  customDomain: null,
}
