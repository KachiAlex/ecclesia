'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDate, formatDuration } from '@/lib/utils'
import Link from 'next/link'
import MediaPlayer from './MediaPlayer'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface SermonPlayerProps {
  sermonId: string
}

interface Sermon {
  id: string
  title: string
  description?: string
  speaker: string
  videoUrl?: string
  audioUrl?: string
  thumbnailUrl?: string
  duration?: number
  category?: string
  tags: string[]
  topics: string[]
  aiSummary?: string
  createdAt: string
  userProgress?: {
    watchedDuration: number
    completed: boolean
    progress: number
  } | null
  isDownloaded: boolean
  _count: {
    views: number
    downloads: number
  }
}

export default function SermonPlayer({ sermonId }: SermonPlayerProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [sermon, setSermon] = useState<Sermon | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [editTitle, setEditTitle] = useState('')
  const [editSpeaker, setEditSpeaker] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDurationMinutes, setEditDurationMinutes] = useState('')
  const [editTags, setEditTags] = useState('')

  const loadSermon = useCallback(async () => {
    try {
      const response = await fetch(`/api/sermons/${sermonId}`)
      if (response.ok) {
        const data = await response.json()
        setSermon(data)

        setEditTitle(data.title || '')
        setEditSpeaker(data.speaker || '')
        setEditDescription(data.description || '')
        setEditCategory(data.category || '')
        setEditDurationMinutes(data.duration ? String(Math.round(data.duration / 60)) : '')
        setEditTags(Array.isArray(data.tags) ? data.tags.join(', ') : '')
      }
    } catch (error) {
      console.error('Error loading sermon:', error)
    } finally {
      setLoading(false)
    }
  }, [sermonId])

  useEffect(() => {
    loadSermon()
  }, [loadSermon])

  const role = (session?.user as any)?.role as string | undefined
  const canManage = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'PASTOR'

  const handleSave = async () => {
    if (!sermon) return
    setSaving(true)
    try {
      const response = await fetch(`/api/sermons/${sermonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          speaker: editSpeaker,
          description: editDescription || undefined,
          category: editCategory || undefined,
          duration: editDurationMinutes ? String(parseInt(editDurationMinutes) * 60) : undefined,
          tags: editTags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.error || 'Failed to update sermon')
      }

      const updated = await response.json()
      setSermon(updated)
      setEditing(false)
    } catch (e: any) {
      alert(e?.message || 'Failed to update sermon')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this sermon? This cannot be undone.')) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/sermons/${sermonId}`, { method: 'DELETE' })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.error || 'Failed to delete sermon')
      }

      router.push('/sermons')
      router.refresh()
    } catch (e: any) {
      alert(e?.message || 'Failed to delete sermon')
    } finally {
      setDeleting(false)
    }
  }

  const handleTimeUpdate = async (currentTime: number) => {
    if (!sermon) return

    const watchedDuration = Math.floor(currentTime)

    // Update progress every 10 seconds
    if (watchedDuration % 10 === 0 && watchedDuration > 0) {
      try {
        await fetch(`/api/sermons/${sermonId}/watch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            watchedDuration,
            completed: sermon.duration
              ? watchedDuration >= sermon.duration * 0.9
              : false,
          }),
        })
      } catch (error) {
        console.error('Error updating progress:', error)
      }
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/sermons/${sermonId}/download`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        // In production, trigger actual download
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank')
        }
        loadSermon() // Reload to update download status
      }
    } catch (error) {
      console.error('Error downloading:', error)
      alert('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading sermon...</div>
      </div>
    )
  }

  if (!sermon) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Sermon not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Link
          href="/sermons"
          className="text-primary-600 hover:underline"
        >
          ← Back to Sermons
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Media Player */}
        <MediaPlayer
          videoUrl={sermon.videoUrl}
          audioUrl={sermon.audioUrl}
          thumbnailUrl={sermon.thumbnailUrl}
          title={sermon.title}
          onTimeUpdate={handleTimeUpdate}
          initialTime={sermon.userProgress?.watchedDuration || 0}
        />

        {/* Sermon Info */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              {editing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Title"
                  />
                  <input
                    type="text"
                    value={editSpeaker}
                    onChange={(e) => setEditSpeaker(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Speaker"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={4}
                    placeholder="Description"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Category"
                    />
                    <input
                      type="number"
                      value={editDurationMinutes}
                      onChange={(e) => setEditDurationMinutes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Duration (minutes)"
                    />
                  </div>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Tags (comma separated)"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold mb-2">{sermon.title}</h1>
                  <p className="text-gray-600 mb-2">By {sermon.speaker}</p>
                </>
              )}
              <div className="flex gap-4 text-sm text-gray-500">
                <span>{formatDate(sermon.createdAt)}</span>
                {sermon.duration && <span>{formatDuration(sermon.duration)}</span>}
                <span>{sermon._count.views} views</span>
              </div>
            </div>
            <div className="flex gap-2">
              {canManage && (
                <>
                  {editing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        disabled={saving}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditing(true)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                </>
              )}
              <button
                onClick={handleDownload}
                disabled={downloading || sermon.isDownloaded}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {downloading
                  ? 'Downloading...'
                  : sermon.isDownloaded
                  ? 'Downloaded'
                  : 'Download'}
              </button>
            </div>
          </div>

          {/* Tags */}
          {sermon.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {sermon.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {sermon.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {sermon.description}
              </p>
            </div>
          )}

          {/* AI Summary */}
          {sermon.aiSummary && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <span>🤖</span> AI Summary
              </h2>
              <p className="text-gray-700">{sermon.aiSummary}</p>
              {sermon.topics.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">Topics:</p>
                  <div className="flex flex-wrap gap-2">
                    {sermon.topics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress */}
          {sermon.userProgress && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Your Progress</span>
                <span>{sermon.userProgress.progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${sermon.userProgress.progress}%` }}
                ></div>
              </div>
              {sermon.userProgress.completed && (
                <p className="text-sm text-green-600 mt-2">✓ Completed</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

