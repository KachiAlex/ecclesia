'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import LivestreamCreator from '@/components/LivestreamCreator'
import {
  LivestreamData,
  LivestreamPlatformStatus,
  StreamingPlatform,
} from '@/lib/types/streaming'

const PLATFORM_META: Record<
  StreamingPlatform,
  { label: string; icon: string; accent: string }
> = {
  [StreamingPlatform.RESTREAM]: { label: 'Restream', icon: '🔄', accent: 'bg-purple-100 text-purple-800' },
  [StreamingPlatform.ZOOM]: { label: 'Zoom', icon: '📹', accent: 'bg-blue-100 text-blue-800' },
  [StreamingPlatform.GOOGLE_MEET]: { label: 'Google Meet', icon: '🎥', accent: 'bg-emerald-100 text-emerald-800' },
  [StreamingPlatform.TEAMS]: { label: 'Microsoft Teams', icon: '👥', accent: 'bg-indigo-100 text-indigo-800' },
  [StreamingPlatform.JITSI]: { label: 'Jitsi', icon: '🛰️', accent: 'bg-cyan-100 text-cyan-800' },
  [StreamingPlatform.INSTAGRAM]: { label: 'Instagram', icon: '📷', accent: 'bg-pink-100 text-pink-800' },
  [StreamingPlatform.YOUTUBE]: { label: 'YouTube', icon: '▶️', accent: 'bg-red-100 text-red-800' },
  [StreamingPlatform.FACEBOOK]: { label: 'Facebook', icon: 'f', accent: 'bg-blue-100 text-blue-800' },
}

const STATUS_META: Record<LivestreamPlatformStatus, string> = {
  [LivestreamPlatformStatus.PENDING]: 'bg-amber-50 text-amber-700',
  [LivestreamPlatformStatus.ACTIVE]: 'bg-green-50 text-green-700',
  [LivestreamPlatformStatus.ENDED]: 'bg-gray-100 text-gray-600',
  [LivestreamPlatformStatus.FAILED]: 'bg-red-50 text-red-700',
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
  const [livestreams, setLivestreams] = useState<LivestreamData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreator, setShowCreator] = useState(false)
  const [creatorError, setCreatorError] = useState<string | null>(null)

  const loadLivestreams = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/livestreams')
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to load livestreams')
      }
      const payload = await res.json()
      setLivestreams(Array.isArray(payload?.data) ? payload.data : payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load livestreams')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLivestreams()
  }, [loadLivestreams])

  const activeLivestream = useMemo(() => {
    if (!livestreams.length) return null
    return (
      livestreams.find((ls) => ls.status === 'LIVE') ??
      livestreams.find((ls) => ls.status === 'SCHEDULED') ??
      livestreams[0]
    )
  }, [livestreams])

  const primaryPlatform = useMemo(() => {
    if (!activeLivestream?.platforms) return null
    const platforms = activeLivestream.platforms
    return (
      platforms.find((p) => p.url && p.platform === StreamingPlatform.YOUTUBE) ??
      platforms.find((p) => p.url && p.platform === StreamingPlatform.FACEBOOK) ??
      platforms.find((p) => p.url)
    )
  }, [activeLivestream])

  const embedUrl = useMemo(() => {
    if (!primaryPlatform?.url) return null
    if (primaryPlatform.platform === StreamingPlatform.YOUTUBE) return getYouTubeEmbedUrl(primaryPlatform.url)
    if (primaryPlatform.platform === StreamingPlatform.FACEBOOK) return getFacebookEmbedUrl(primaryPlatform.url)
    return null
  }, [primaryPlatform])

  const statusText = useMemo(() => {
    if (!activeLivestream) return 'No livestream scheduled.'
    if (activeLivestream.status === 'LIVE') return 'Live now'
    if (activeLivestream.status === 'SCHEDULED') return 'Upcoming livestream'
    return 'Previous livestream'
  }, [activeLivestream])

  const handleCreatorSuccess = (livestreamId: string) => {
    setShowCreator(false)
    setCreatorError(null)
    if (livestreamId) {
      loadLivestreams()
    }
  }

  const handleCreatorError = (message: string) => {
    setCreatorError(message)
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading livestreams...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Livestream</h1>
          <p className="text-gray-600">
            Watch live services or join from your preferred platform. We support YouTube, Facebook, Instagram, Restream, and more.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreator(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            + Schedule Multi-Platform Stream
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {activeLivestream ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500">{statusText}</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">{activeLivestream.title}</div>
                {activeLivestream.description && (
                  <p className="text-gray-600 mt-2 max-w-2xl">{activeLivestream.description}</p>
                )}
                <div className="text-sm text-gray-500 mt-2">
                  {activeLivestream.startAt
                    ? `Starts ${new Date(activeLivestream.startAt).toLocaleString()}`
                    : 'Start time TBA'}
                </div>
                {primaryPlatform?.url && (
                  <a
                    href={primaryPlatform.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-primary-600 hover:underline mt-3 text-sm font-medium"
                  >
                    Open on {PLATFORM_META[primaryPlatform.platform].label}
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
              {activeLivestream.platforms && activeLivestream.platforms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeLivestream.platforms.map((platform) => (
                    <div
                      key={platform.id || `${activeLivestream.id}-${platform.platform}`}
                      className={`px-3 py-2 rounded-lg border text-sm ${PLATFORM_META[platform.platform].accent}`}
                    >
                      <div className="font-semibold flex items-center gap-2">
                        <span>{PLATFORM_META[platform.platform].icon}</span>
                        <span>{PLATFORM_META[platform.platform].label}</span>
                      </div>
                      <div className={`mt-1 inline-flex px-2 py-0.5 rounded-full text-xs ${STATUS_META[platform.status]}`}>
                        {platform.status.charAt(0) + platform.status.slice(1).toLowerCase()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {embedUrl ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src={embedUrl}
                  title="Livestream"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="w-full h-96 bg-gray-900 flex items-center justify-center text-white rounded-lg">
                <p className="text-lg">Live video will appear here when the stream starts.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
          No livestreams scheduled yet. Check back soon!
        </div>
      )}

      {livestreams.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Livestreams</h2>
          <div className="space-y-4">
            {livestreams.map((ls) => (
              <div
                key={ls.id}
                className="flex flex-wrap items-center justify-between border border-gray-100 rounded-lg p-4 gap-4"
              >
                <div>
                  <div className="font-semibold text-gray-900">{ls.title}</div>
                  <div className="text-sm text-gray-500">
                    {ls.startAt ? new Date(ls.startAt).toLocaleString() : 'Start time TBA'}
                  </div>
                  {ls.description && <div className="text-sm text-gray-600 mt-1 max-w-2xl">{ls.description}</div>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {ls.platforms?.map((platform) => (
                    <a
                      key={platform.id || `${ls.id}-${platform.platform}`}
                      href={platform.url || '#'}
                      target={platform.url ? '_blank' : undefined}
                      rel="noreferrer"
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                        PLATFORM_META[platform.platform].accent
                      } ${platform.url ? 'hover:opacity-80 transition' : 'opacity-60 cursor-not-allowed'}`}
                    >
                      {PLATFORM_META[platform.platform].label}
                      {platform.url ? ' ↗' : ''}
                    </a>
                  ))}
                  <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {ls.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && showCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreator(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Schedule Multi-Platform Livestream</h3>
                <p className="text-sm text-gray-600">Select one or more platforms and customize each stream.</p>
              </div>
              <button
                className="text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setShowCreator(false)}
                aria-label="Close livestream creator"
              >
                ×
              </button>
            </div>
            {creatorError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm">
                {creatorError}
              </div>
            )}
            <LivestreamCreator onSuccess={handleCreatorSuccess} onError={handleCreatorError} />
          </div>
        </div>
      )}
    </div>
  )
}
