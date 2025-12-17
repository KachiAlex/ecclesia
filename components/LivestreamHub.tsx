'use client'

import { useEffect, useMemo, useState } from 'react'

type Platform = 'youtube' | 'facebook'

type LivestreamConfig = {
  id: string
  enabled: boolean
  platform: Platform
  url: string
  title?: string
  description?: string
  scheduledAt?: string
}

const getYouTubeEmbedUrl = (url: string) => {
  const trimmed = url.trim()

  const idFromEmbed = trimmed.match(/youtube\.com\/embed\/([^?&/]+)/i)?.[1]
  if (idFromEmbed) return `https://www.youtube.com/embed/${idFromEmbed}`

  const idFromWatch = trimmed.match(/[?&]v=([^?&/]+)/i)?.[1]
  if (idFromWatch) return `https://www.youtube.com/embed/${idFromWatch}`

  const idFromShort = trimmed.match(/youtu\.be\/([^?&/]+)/i)?.[1]
  if (idFromShort) return `https://www.youtube.com/embed/${idFromShort}`

  return trimmed
}

const getFacebookEmbedUrl = (url: string) => {
  const u = encodeURIComponent(url.trim())
  return `https://www.facebook.com/plugins/video.php?href=${u}&show_text=false&width=1280`
}

export default function LivestreamHub({ isAdmin }: { isAdmin: boolean }) {
  const [config, setConfig] = useState<LivestreamConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    enabled: false,
    platform: 'youtube' as Platform,
    url: '',
    title: '',
    description: '',
    scheduledAt: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/livestream')
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
        if (data) {
          setForm({
            enabled: !!data.enabled,
            platform: data.platform,
            url: data.url || '',
            title: data.title || '',
            description: data.description || '',
            scheduledAt: data.scheduledAt ? String(data.scheduledAt).slice(0, 16) : '',
          })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const embedUrl = useMemo(() => {
    if (!config?.enabled || !config.url) return null
    if (config.platform === 'youtube') return getYouTubeEmbedUrl(config.url)
    return getFacebookEmbedUrl(config.url)
  }, [config])

  const statusText = useMemo(() => {
    if (!config?.enabled) return 'No live service right now.'
    if (!config.url) return 'Livestream is enabled but not configured.'
    return 'Live now'
  }, [config])

  const onSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/livestream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to save')
      }

      await load()
      alert('Livestream settings saved')
    } catch (e: any) {
      alert(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Livestream</h1>
          <p className="text-gray-600">Join the live service stream from YouTube or Facebook.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="text-lg font-semibold">{statusText}</div>
              {config?.title && <div className="text-gray-700 mt-2 font-medium">{config.title}</div>}
              {config?.description && <div className="text-gray-600 mt-1">{config.description}</div>}
              {config?.scheduledAt && (
                <div className="text-sm text-gray-500 mt-2">Scheduled: {new Date(config.scheduledAt).toLocaleString()}</div>
              )}
              {config?.enabled && config?.url && (
                <a className="inline-block mt-3 text-primary-600 hover:underline" href={config.url} target="_blank" rel="noreferrer">
                  Open on {config.platform === 'youtube' ? 'YouTube' : 'Facebook'}
                </a>
              )}
            </div>
            {isAdmin && (
              <div className="shrink-0">
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {embedUrl ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={embedUrl}
                title="Livestream"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="w-full h-96 bg-black flex items-center justify-center text-white rounded-lg">
              <p>{statusText}</p>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Configure Livestream</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              />
              <span className="text-sm font-medium">Enable livestream</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value as Platform })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Livestream URL</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="Paste the YouTube Live or Facebook Live URL"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <div className="text-xs text-gray-500 mt-1">
                For YouTube, paste a watch URL, youtu.be URL, or an embed URL. For Facebook, paste the video/live URL.
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled time (optional)</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
