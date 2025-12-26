'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Church {
  id: string
  name: string
  description?: string | null
  tagline?: string | null
  timezone?: string | null
  defaultLocale?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  country?: string | null
  organizationEmail?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  givingLink?: string | null
  estimatedMembers?: number | null
}

interface GeneralSettingsProps {
  church: Church
}

const TIMEZONES = [
  'Africa/Lagos',
  'Africa/Accra',
  'Africa/Nairobi',
  'Africa/Johannesburg',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Kolkata',
]

const LOCALES = [
  { value: 'en-NG', label: 'English (Nigeria)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'fr-FR', label: 'French' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
]

const COUNTRIES = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'United Kingdom', 'United States', 'Canada']

type FormState = {
  name: string
  tagline: string
  description: string
  timezone: string
  defaultLocale: string
  organizationEmail: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  website: string
  givingLink: string
  estimatedMembers: string
}

const detectDifferences = (next: FormState, snapshot: FormState) =>
  Object.keys(next).some((field) => next[field as keyof FormState] !== snapshot[field as keyof FormState])

const SectionCard = ({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="mb-4">
      <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{title}</p>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
    <div className="grid gap-4">{children}</div>
  </section>
)

export default function GeneralSettings({ church }: GeneralSettingsProps) {
  const router = useRouter()

  const defaults = useMemo<FormState>(
    () => ({
      name: church.name ?? '',
      tagline: church.tagline ?? '',
      description: church.description ?? '',
      timezone: church.timezone ?? TIMEZONES[0],
      defaultLocale: church.defaultLocale ?? 'en-NG',
      organizationEmail: church.organizationEmail ?? church.email ?? '',
      phone: church.phone ?? '',
      address: church.address ?? '',
      city: church.city ?? '',
      state: church.state ?? '',
      zipCode: church.zipCode ?? '',
      country: church.country ?? COUNTRIES[0],
      website: church.website ?? '',
      givingLink: church.givingLink ?? '',
      estimatedMembers: church.estimatedMembers?.toString() ?? '',
    }),
    [church],
  )

  const [formData, setFormData] = useState<FormState>(defaults)
  const [baseline, setBaseline] = useState<FormState>(defaults)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleFieldChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      setHasChanges(detectDifferences(next, baseline))
      return next
    })
  }

  const handleReset = () => {
    setFormData(baseline)
    setHasChanges(false)
    setError('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving || !hasChanges) return

    setError('')
    setSuccess(false)
    setSaving(true)

    const payload: Record<string, unknown> = {
      name: formData.name.trim(),
      tagline: formData.tagline.trim(),
      description: formData.description.trim(),
      timezone: formData.timezone,
      defaultLocale: formData.defaultLocale,
      organizationEmail: formData.organizationEmail.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      zipCode: formData.zipCode.trim(),
      country: formData.country,
      website: formData.website.trim(),
      givingLink: formData.givingLink.trim(),
    }

    if (formData.estimatedMembers.trim()) {
      payload.estimatedMembers = Number(formData.estimatedMembers) || 0
    } else {
      payload.estimatedMembers = null
    }

    try {
      const response = await fetch(`/api/churches/${church.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update settings')
      }

      const nextBaseline = { ...formData }
      setBaseline(nextBaseline)
      setHasChanges(false)
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg">
          Church profile updated.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard title="Identity" description="This information appears on landing pages and internal dashboards.">
          <label className="text-sm text-gray-600 flex flex-col gap-1">
            Church name
            <input
              type="text"
              value={formData.name}
              onChange={(event) => handleFieldChange('name', event.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g. Ecclesia Mainland"
            />
          </label>
          <label className="text-sm text-gray-600 flex flex-col gap-1">
            Tagline
            <input
              type="text"
              value={formData.tagline}
              onChange={(event) => handleFieldChange('tagline', event.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Short rallying cry for new members"
            />
          </label>
          <label className="text-sm text-gray-600 flex flex-col gap-1">
            Description
            <textarea
              value={formData.description}
              onChange={(event) => handleFieldChange('description', event.target.value)}
              rows={3}
              className="rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Tell members what makes this campus special."
            />
          </label>
        </SectionCard>

        <SectionCard
          title="Location & contact"
          description="Used for attendance exports, invites, and automatic map previews."
        >
          <label className="text-sm text-gray-600 flex flex-col gap-1">
            Street address
            <input
              type="text"
              value={formData.address}
              onChange={(event) => handleFieldChange('address', event.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </label>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              City
              <input
                type="text"
                value={formData.city}
                onChange={(event) => handleFieldChange('city', event.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </label>
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              State / province
              <input
                type="text"
                value={formData.state}
                onChange={(event) => handleFieldChange('state', event.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </label>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Postal code
              <input
                type="text"
                value={formData.zipCode}
                onChange={(event) => handleFieldChange('zipCode', event.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </label>
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Country
              <select
                value={formData.country}
                onChange={(event) => handleFieldChange('country', event.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Estimated members
              <input
                type="number"
                min={0}
                value={formData.estimatedMembers}
                onChange={(event) => handleFieldChange('estimatedMembers', event.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Office email
              <input
                type="email"
                value={formData.organizationEmail}
                onChange={(event) => handleFieldChange('organizationEmail', event.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="hello@youreccleisa.org"
              />
            </label>
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Phone number
              <input
                type="tel"
                value={formData.phone}
                onChange={(event) => handleFieldChange('phone', event.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+234 800 000 0000"
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Communication defaults" description="Used for reminders, event invites, and reporting.">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Default timezone
              <select
                value={formData.timezone}
                onChange={(event) => handleFieldChange('timezone', event.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">Event reminders and classes use this timezone unless overridden.</span>
            </label>
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Default locale
              <select
                value={formData.defaultLocale}
                onChange={(event) => handleFieldChange('defaultLocale', event.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {LOCALES.map((locale) => (
                  <option key={locale.value} value={locale.value}>
                    {locale.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">Determines UI language for members during onboarding.</span>
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Web & giving" description="Surface links wherever members interact with your church.">
          <label className="text-sm text-gray-600 flex flex-col gap-1">
            Website
            <input
              type="url"
              value={formData.website}
              onChange={(event) => handleFieldChange('website', event.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://ecclesia.church"
            />
          </label>
          <label className="text-sm text-gray-600 flex flex-col gap-1">
            Giving link
            <input
              type="url"
              value={formData.givingLink}
              onChange={(event) => handleFieldChange('givingLink', event.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://give.ecclesia.church"
            />
            <span className="text-xs text-gray-500">
              Displayed in Digital School certificates and member dashboards.
            </span>
          </label>
        </SectionCard>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving || !hasChanges}
            className="px-4 py-2 rounded-xl border text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Reset changes
          </button>
          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="px-6 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold shadow-sm hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
