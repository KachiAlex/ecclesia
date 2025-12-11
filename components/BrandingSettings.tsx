'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Church {
  id: string
  name: string
  logo?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  customDomain?: string | null
  domainVerified?: boolean
}

interface BrandingSettingsProps {
  church: Church
}

export default function BrandingSettings({ church }: BrandingSettingsProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    logo: church.logo || '',
    primaryColor: church.primaryColor || '#0ea5e9',
    secondaryColor: church.secondaryColor || '#6366f1',
    customDomain: church.customDomain || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)

    try {
      const response = await fetch(`/api/churches/${church.id}/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update branding')
      }

      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            Branding updated successfully!
          </div>
        )}

        <div>
          <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
            Logo URL
          </label>
          <input
            id="logo"
            type="url"
            value={formData.logo}
            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="https://example.com/logo.png"
          />
          {formData.logo && (
            <div className="mt-2">
              <img
                src={formData.logo}
                alt="Logo preview"
                className="h-20 w-auto object-contain"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="primaryColor"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Primary Color
            </label>
            <div className="flex gap-2">
              <input
                id="primaryColor"
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="#0ea5e9"
              />
            </div>
            <div
              className="mt-2 h-8 rounded"
              style={{ backgroundColor: formData.primaryColor }}
            ></div>
          </div>

          <div>
            <label
              htmlFor="secondaryColor"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Secondary Color
            </label>
            <div className="flex gap-2">
              <input
                id="secondaryColor"
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="#6366f1"
              />
            </div>
            <div
              className="mt-2 h-8 rounded"
              style={{ backgroundColor: formData.secondaryColor }}
            ></div>
          </div>
        </div>

        <div>
          <label
            htmlFor="customDomain"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Custom Domain
          </label>
          <input
            id="customDomain"
            type="text"
            value={formData.customDomain}
            onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="app.yourchurch.com"
          />
          <p className="mt-1 text-sm text-gray-500">
            After setting your domain, you'll need to verify it by adding a DNS record.
          </p>
          {church.domainVerified && (
            <p className="mt-1 text-sm text-green-600">✓ Domain verified</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

