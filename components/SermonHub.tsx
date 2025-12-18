'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Sermon {
  id: string
  title: string
  description?: string
  speaker: string
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
  _count: {
    views: number
    downloads: number
  }
}

export default function SermonHub() {
  const [sermons, setSermons] = useState<Sermon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [canUpload, setCanUpload] = useState(false)

  useEffect(() => {
    loadSermons()
  }, [search, category])

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch('/api/users/me')
        if (!res.ok) return
        const me = await res.json().catch(() => null)
        const role = String(me?.role || '')
        setCanUpload(role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'PASTOR')
      } catch {
        // ignore
      }
    }
    loadMe()
  }, [])

  useEffect(() => {
    // Extract unique categories from sermons after they're loaded
    const cats = Array.from(new Set(sermons.map((s) => s.category).filter(Boolean)))
    setCategories(cats as string[])
  }, [sermons])

  const loadSermons = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (category) params.append('category', category)

      const response = await fetch(`/api/sermons?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSermons(data.sermons || [])
      } else {
        console.error('Failed to load sermons')
      }
    } catch (error) {
      console.error('Error loading sermons:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading sermons...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sermon Hub</h1>
          <p className="text-gray-600">
            Watch sermons, continue where you left off, and download for offline listening
          </p>
        </div>
        {canUpload && (
          <Link
            href="/sermons/upload"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2"
          >
            <span>📤</span> Upload Sermon
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sermons..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          {categories.length > 0 && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Continue Watching */}
      {sermons.some((s) => s.userProgress && !s.userProgress.completed) && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Continue Watching</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sermons
              .filter((s) => s.userProgress && !s.userProgress.completed)
              .slice(0, 4)
              .map((sermon) => (
                <Link
                  key={sermon.id}
                  href={`/sermons/${sermon.id}`}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {sermon.thumbnailUrl ? (
                    <div className="relative">
                      <img
                        src={sermon.thumbnailUrl}
                        alt={sermon.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                        <div className="w-full bg-gray-700 rounded-full h-1">
                          <div
                            className="bg-primary-600 h-1 rounded-full"
                            style={{ width: `${sermon.userProgress?.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                      <span className="text-white text-2xl">▶</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-2">{sermon.title}</h3>
                    <p className="text-sm text-gray-600">{sermon.speaker}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDuration(sermon.duration)}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* All Sermons */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">All Sermons</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sermons.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No sermons found
            </div>
          ) : (
            sermons.map((sermon) => (
              <Link
                key={sermon.id}
                href={`/sermons/${sermon.id}`}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {sermon.thumbnailUrl ? (
                  <img
                    src={sermon.thumbnailUrl}
                    alt={sermon.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                    <span className="text-white text-4xl">▶</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold mb-1 line-clamp-2">{sermon.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{sermon.speaker}</p>
                  {sermon.category && (
                    <span className="inline-block px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs mb-2">
                      {sermon.category}
                    </span>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{formatDuration(sermon.duration)}</span>
                    <span>{sermon._count.views} views</span>
                  </div>
                  {sermon.userProgress?.completed && (
                    <div className="mt-2 text-xs text-green-600">✓ Completed</div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

