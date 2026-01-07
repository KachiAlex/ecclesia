'use client'

import { useEffect, useMemo, useState } from 'react'
import { StreamingPlatform } from '@/lib/types/streaming'

type Connection = {
  platform: StreamingPlatform
  status: string
  expiresAt?: string
  lastError?: string
  lastErrorAt?: string
}

type ConnectionsResponse = {
  connections: Connection[]
  error?: string
}

const platformLabels: Record<StreamingPlatform, string> = {
  [StreamingPlatform.RESTREAM]: 'Restream',
  [StreamingPlatform.YOUTUBE]: 'YouTube',
  [StreamingPlatform.FACEBOOK]: 'Facebook',
  [StreamingPlatform.INSTAGRAM]: 'Instagram',
  [StreamingPlatform.ZOOM]: 'Zoom',
  [StreamingPlatform.TEAMS]: 'Microsoft Teams',
  [StreamingPlatform.JITSI]: 'Jitsi',
  [StreamingPlatform.GOOGLE_MEET]: 'Google Meet',
}

export default function StreamingPlatformsSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [error, setError] = useState<string | null>(null)

  const [restreamApiKey, setRestreamApiKey] = useState('')

  const [youtubeAccessToken, setYoutubeAccessToken] = useState('')
  const [youtubeRefreshToken, setYoutubeRefreshToken] = useState('')
  const [youtubeChannelId, setYoutubeChannelId] = useState('')

  const [facebookAccessToken, setFacebookAccessToken] = useState('')
  const [facebookPageId, setFacebookPageId] = useState('')

  const byPlatform = useMemo(() => {
    const m = new Map<StreamingPlatform, Connection>()
    for (const c of connections) m.set(c.platform, c)
    return m
  }, [connections])

  const loadConnections = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/platform-connections', { cache: 'no-store' })
      const data = (await res.json()) as ConnectionsResponse
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load connections')
      }
      setConnections(Array.isArray(data.connections) ? data.connections : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load connections')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConnections()
  }, [])

  const saveConnection = async (platform: StreamingPlatform, credentials: Record<string, any>) => {
    setSaving(platform)
    setError(null)
    try {
      const res = await fetch('/api/platform-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, credentials }),
      })

      const data = (await res.json()) as { connection?: any; error?: string }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save connection')
      }

      await loadConnections()

      if (platform === StreamingPlatform.RESTREAM) {
        setRestreamApiKey('')
      }

      if (platform === StreamingPlatform.YOUTUBE) {
        setYoutubeAccessToken('')
        setYoutubeRefreshToken('')
        setYoutubeChannelId('')
      }

      if (platform === StreamingPlatform.FACEBOOK) {
        setFacebookAccessToken('')
        setFacebookPageId('')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save connection')
    } finally {
      setSaving(null)
    }
  }

  const disconnect = async (platform: StreamingPlatform) => {
    setSaving(platform)
    setError(null)
    try {
      const res = await fetch('/api/platform-connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to disconnect')
      }
      await loadConnections()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to disconnect')
    } finally {
      setSaving(null)
    }
  }

  const renderStatus = (platform: StreamingPlatform) => {
    const c = byPlatform.get(platform)
    if (!c) return 'Not connected'
    if (c.status === 'CONNECTED') return 'Connected'
    if (c.status === 'EXPIRED') return 'Expired'
    if (c.status === 'ERROR') return 'Error'
    return 'Disconnected'
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Streaming Platforms</h1>
      <p className="text-sm text-gray-600 mb-8">
        Connect your streaming platforms so Ecclesia can create and manage livestreams directly.
      </p>

      {error ? (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="space-y-6">
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">{platformLabels[StreamingPlatform.RESTREAM]}</div>
              <div className="text-sm text-gray-600 mt-1">Status: {renderStatus(StreamingPlatform.RESTREAM)}</div>
            </div>
            <button
              className="border rounded-md px-3 py-2 text-sm"
              disabled={saving === StreamingPlatform.RESTREAM}
              onClick={() => disconnect(StreamingPlatform.RESTREAM)}
            >
              Disconnect
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={restreamApiKey}
                onChange={(e) => setRestreamApiKey(e.target.value)}
                placeholder="restream api key"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              className="bg-black text-white rounded-md px-4 py-2 text-sm"
              disabled={saving === StreamingPlatform.RESTREAM}
              onClick={() =>
                saveConnection(StreamingPlatform.RESTREAM, {
                  apiKey: restreamApiKey.trim(),
                })
              }
            >
              {saving === StreamingPlatform.RESTREAM ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">{platformLabels[StreamingPlatform.YOUTUBE]}</div>
              <div className="text-sm text-gray-600 mt-1">Status: {renderStatus(StreamingPlatform.YOUTUBE)}</div>
            </div>
            <button
              className="border rounded-md px-3 py-2 text-sm"
              disabled={saving === StreamingPlatform.YOUTUBE}
              onClick={() => disconnect(StreamingPlatform.YOUTUBE)}
            >
              Disconnect
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Access Token</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={youtubeAccessToken}
                onChange={(e) => setYoutubeAccessToken(e.target.value)}
                placeholder="youtube access token"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Refresh Token (optional)</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={youtubeRefreshToken}
                onChange={(e) => setYoutubeRefreshToken(e.target.value)}
                placeholder="youtube refresh token"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Channel ID (optional)</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={youtubeChannelId}
                onChange={(e) => setYoutubeChannelId(e.target.value)}
                placeholder="UCxxxxxxxxxxxxxxxx"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              className="bg-black text-white rounded-md px-4 py-2 text-sm"
              disabled={saving === StreamingPlatform.YOUTUBE}
              onClick={() =>
                saveConnection(StreamingPlatform.YOUTUBE, {
                  accessToken: youtubeAccessToken.trim(),
                  refreshToken: youtubeRefreshToken.trim() || undefined,
                  channelId: youtubeChannelId.trim() || undefined,
                })
              }
            >
              {saving === StreamingPlatform.YOUTUBE ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">{platformLabels[StreamingPlatform.FACEBOOK]}</div>
              <div className="text-sm text-gray-600 mt-1">Status: {renderStatus(StreamingPlatform.FACEBOOK)}</div>
            </div>
            <button
              className="border rounded-md px-3 py-2 text-sm"
              disabled={saving === StreamingPlatform.FACEBOOK}
              onClick={() => disconnect(StreamingPlatform.FACEBOOK)}
            >
              Disconnect
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Access Token</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={facebookAccessToken}
                onChange={(e) => setFacebookAccessToken(e.target.value)}
                placeholder="facebook access token"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Page ID (optional)</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={facebookPageId}
                onChange={(e) => setFacebookPageId(e.target.value)}
                placeholder="1234567890"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              className="bg-black text-white rounded-md px-4 py-2 text-sm"
              disabled={saving === StreamingPlatform.FACEBOOK}
              onClick={() =>
                saveConnection(StreamingPlatform.FACEBOOK, {
                  accessToken: facebookAccessToken.trim(),
                  pageId: facebookPageId.trim() || undefined,
                })
              }
            >
              {saving === StreamingPlatform.FACEBOOK ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          {loading ? 'Loading connections...' : null}
        </div>
      </div>
    </div>
  )
}
