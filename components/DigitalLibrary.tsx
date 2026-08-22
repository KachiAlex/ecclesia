'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import type { UserRole } from '@/types'

interface Category {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
}

interface Resource {
  id: string
  title: string
  description?: string
  author?: string
  categoryId?: string
  tags?: string[]
  type: string
  fileUrl?: string
  fileName?: string
  contentType?: string
  size?: number
  createdAt: string
  planIds?: string[]
}

const RESOURCE_TYPES = [
  { value: 'all', label: 'All formats' },
  { value: 'book', label: 'Books & ePubs' },
  { value: 'pdf', label: 'PDF Guides' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'link', label: 'Links' },
]

type EnrichedResource = Resource & { category?: Category }

const ALLOWED_UPLOAD_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

export default function DigitalLibrary() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeType, setActiveType] = useState('all')
  const [selectedResource, setSelectedResource] = useState<EnrichedResource | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    author: '',
    description: '',
    categoryId: '',
    tags: '',
  })
  const [resourceFile, setResourceFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    const res = await fetch('/api/reading-library/categories')
    if (res.ok) {
      const data = await res.json()
      setCategories(data.categories || [])
    }
  }, [])

  const loadResources = useCallback(async () => {
    const params = new URLSearchParams()
    const trimmedSearch = search.trim()
    if (trimmedSearch) params.set('search', trimmedSearch)
    if (activeCategory) params.set('categoryId', activeCategory)
    if (activeType !== 'all') params.set('type', activeType)

    const res = await fetch(`/api/reading-library/resources?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      setResources(data.resources || [])
    }
  }, [activeCategory, activeType, search])

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true)
      await Promise.all([loadCategories(), loadResources()])
    } finally {
      setLoading(false)
    }
  }, [loadCategories, loadResources])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  useEffect(() => {
    loadResources()
  }, [loadResources])

  const categorizedResources = useMemo<EnrichedResource[]>(() => {
    return resources.map((resource) => ({
      ...resource,
      category: categories.find((cat) => cat.id === resource.categoryId),
    }))
  }, [resources, categories])

  const featuredResources = useMemo(() => {
    return categorizedResources.slice(0, 3)
  }, [categorizedResources])

  const canUpload = useMemo(() => {
    const role = (session?.user as any)?.role as UserRole | undefined
    if (!role) return false
    return ALLOWED_UPLOAD_ROLES.includes(role)
  }, [session])

  const resetUploadState = () => {
    setUploadForm({
      title: '',
      author: '',
      description: '',
      categoryId: '',
      tags: '',
    })
    setResourceFile(null)
    setUploadError(null)
    setUploadSuccess(null)
  }

  const handleUploadResource = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!resourceFile) {
      setUploadError('Please choose a file to upload.')
      return
    }
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)
    try {
      const formData = new FormData()
      formData.append('file', resourceFile)
      if (uploadForm.title) formData.append('title', uploadForm.title)
      if (uploadForm.description) formData.append('description', uploadForm.description)
      if (uploadForm.author) formData.append('author', uploadForm.author)
      if (uploadForm.categoryId) formData.append('categoryId', uploadForm.categoryId)
      if (uploadForm.tags) formData.append('tags', uploadForm.tags)
      formData.append('type', 'book')

      const response = await fetch('/api/reading-plans/resources/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to upload book.')
      }

      setUploadSuccess('Book uploaded successfully.')
      await loadResources()
      setUploadModalOpen(false)
      resetUploadState()
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload book.')
    } finally {
      setUploading(false)
    }
  }

  const closeUploadModal = () => {
    if (uploading) return
    setUploadModalOpen(false)
    resetUploadState()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="h-10 w-1/3 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10 space-y-10">
      <header className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-3xl p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">Digital Library</p>
            <h1 className="text-4xl font-semibold mt-2">Your curated discipleship library</h1>
            <p className="text-white/85 mt-3 max-w-2xl">
              Dive into devotionals, eBooks, sermon studies, and multimedia resources selected by our leaders to help
              you grow daily.
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <StatPill label="Resources" value={resources.length} />
            <StatPill label="Categories" value={categories.length} />
          </div>
          {canUpload && (
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="px-5 py-3 bg-white text-primary-600 font-semibold rounded-2xl shadow hover:bg-primary-50 transition"
            >
              Upload Book
            </button>
          )}
        </div>
      </header>

      <section className="bg-white rounded-2xl shadow p-6 border border-gray-100 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-initial">
              <input
                type="text"
                placeholder="Search titles, authors, or tags..."
                className="w-full border rounded-xl px-4 py-3 pl-11 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <select
              className="border rounded-xl px-4 py-3 focus:ring-primary-500 focus:border-primary-500"
              value={activeType}
              onChange={(e) => setActiveType(e.target.value)}
            >
              {RESOURCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <CategoryChip
            active={!activeCategory}
            label="All topics"
            onClick={() => setActiveCategory(null)}
          />
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              active={activeCategory === category.id}
              label={`${category.icon || '📘'} ${category.name}`}
              color={category.color}
              onClick={() => setActiveCategory((prev) => (prev === category.id ? null : category.id))}
            />
          ))}
        </div>
      </section>

      {!!featuredResources.length && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Featured this week</h2>
            {featuredResources.length > 2 && (
              <span className="text-sm text-gray-500">Handpicked by our pastors</span>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onRead={() => {
                  setSelectedResource(resource)
                  if (resource.fileUrl) {
                    window.open(resource.fileUrl, '_blank', 'noopener noreferrer')
                  }
                }}
                onPreview={() => setSelectedResource(resource)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Browse the full library</h2>
          <p className="text-sm text-gray-500">
            Showing {categorizedResources.length} resources ·{' '}
            <Link href="/dashboard/reading-plans" className="text-primary-600 underline">
              Need plan-specific resources?
            </Link>
          </p>
        </div>

        {categorizedResources.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-500">
            No resources match those filters yet. Try a different category or keyword.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categorizedResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onRead={() => {
                  setSelectedResource(resource)
                  if (resource.fileUrl) {
                    window.open(resource.fileUrl, '_blank', 'noopener noreferrer')
                  }
                }}
                onPreview={() => setSelectedResource(resource)}
              />
            ))}
          </div>
        )}
      </section>

      {selectedResource && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedResource(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <div className="space-y-4 pr-6">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                {selectedResource.category?.icon || '📘'} {selectedResource.category?.name || 'Resource'}
              </span>
              <h3 className="text-2xl font-semibold">{selectedResource.title}</h3>
              {selectedResource.author && <p className="text-gray-600">by {selectedResource.author}</p>}
              {selectedResource.description && <p className="text-gray-600">{selectedResource.description}</p>}
              {selectedResource.tags?.length && (
                <div className="flex flex-wrap gap-2">
                  {selectedResource.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                {selectedResource.fileUrl && (
                  <a
                    href={selectedResource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Open Resource
                  </a>
                )}
                {selectedResource.planIds?.length ? (
                  <span className="text-sm text-gray-500">
                    Used in {selectedResource.planIds.length} reading plan
                    {selectedResource.planIds.length > 1 ? 's' : ''}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative p-6">
            <button
              onClick={closeUploadModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <div className="space-y-4 pr-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-primary-500">Upload Book</p>
                <h3 className="text-2xl font-semibold mt-1">Share a new discipleship resource</h3>
                <p className="text-gray-500 text-sm">
                  Books will become instantly available to members of your church after upload.
                </p>
              </div>
              <form className="space-y-4" onSubmit={handleUploadResource}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Title</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Book title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Author</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Optional"
                      value={uploadForm.author}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, author: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Description</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2"
                    rows={3}
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Category</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2"
                      value={uploadForm.categoryId}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Tags (comma separated)</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, tags: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Upload file (PDF / EPUB / DOC / PPT)</label>
                  <input
                    type="file"
                    accept=".pdf,.epub,.doc,.docx,.ppt,.pptx"
                    className="w-full border rounded-lg px-3 py-2"
                    onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Max size: 50MB.</p>
                </div>

                {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
                {uploadSuccess && <p className="text-sm text-green-600">{uploadSuccess}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
                  >
                    {uploading ? 'Uploading...' : 'Upload Book'}
                  </button>
                  <button
                    type="button"
                    onClick={closeUploadModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/15 rounded-2xl px-5 py-3 text-left">
      <p className="text-xs uppercase tracking-[0.25em] text-white/70">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
    </div>
  )
}

function CategoryChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string
  active: boolean
  color?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full border text-sm transition ${
        active
          ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200/60'
          : 'text-gray-600 border-gray-200 hover:border-primary-400 hover:text-primary-600'
      }`}
      style={active && color ? { backgroundColor: color, borderColor: color } : undefined}
    >
      {label}
    </button>
  )
}

function ResourceCard({
  resource,
  onRead,
  onPreview,
}: {
  resource: EnrichedResource
  onRead: () => void
  onPreview: () => void
}) {
  return (
    <div className="border border-gray-100 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition flex flex-col gap-3">
      <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wide text-primary-600 font-semibold bg-primary-50 px-2 py-1 rounded-full">
          {resource.type}
        </span>
        {resource.category && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            {resource.category.icon || '📘'} {resource.category.name}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{resource.title}</h3>
        {resource.author && <p className="text-sm text-gray-500">by {resource.author}</p>}
        {resource.description && <p className="text-sm text-gray-600 line-clamp-3">{resource.description}</p>}
      </div>
      {resource.tags?.length && (
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {resource.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="bg-gray-100 px-2 py-1 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onRead}
          disabled={!resource.fileUrl}
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-500"
        >
          Read / Download
        </button>
        <button
          type="button"
          onClick={onPreview}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          Details
        </button>
      </div>
    </div>
  )
}
