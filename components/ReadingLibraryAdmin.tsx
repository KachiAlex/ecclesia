'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

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

const RESOURCE_TYPES = ['book', 'pdf', 'audio', 'video', 'link']

export default function ReadingLibraryAdmin() {
  const [categories, setCategories] = useState<Category[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryForm, setCategoryForm] = useState<{ id?: string; name: string; description?: string; color?: string; icon?: string }>({
    name: '',
  })
  const [resourceFilters, setResourceFilters] = useState<{ search?: string; categoryId?: string }>({})
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [resourceForm, setResourceForm] = useState({
    planIds: '',
    title: '',
    description: '',
    author: '',
    categoryId: '',
    tags: '',
    type: 'book',
  })
  const [resourceFile, setResourceFile] = useState<File | null>(null)
  const [submittingCategory, setSubmittingCategory] = useState(false)
  const [uploadingResource, setUploadingResource] = useState(false)

  const loadCategories = useCallback(async () => {
    const res = await fetch('/api/reading-library/categories')
    if (res.ok) {
      const data = await res.json()
      setCategories(data.categories || [])
    }
  }, [])

  const loadResources = useCallback(async () => {
    const params = new URLSearchParams()
    if (resourceFilters.search) params.set('search', resourceFilters.search)
    if (resourceFilters.categoryId) params.set('categoryId', resourceFilters.categoryId)

    const res = await fetch(`/api/reading-library/resources?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      setResources(data.resources || [])
    }
  }, [resourceFilters])

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      await Promise.all([loadCategories(), loadResources()])
    } finally {
      setLoading(false)
    }
  }, [loadCategories, loadResources])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    loadResources()
  }, [loadResources])

  const handleCategorySubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!categoryForm.name) return
    setSubmittingCategory(true)
    try {
      const method = categoryForm.id ? 'PATCH' : 'POST'
      const url = categoryForm.id
        ? `/api/reading-library/categories/${categoryForm.id}`
        : '/api/reading-library/categories'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description,
          color: categoryForm.color,
          icon: categoryForm.icon,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        alert(err.error || 'Failed to save category')
        return
      }

      setCategoryForm({ name: '' })
      await loadCategories()
    } catch (error) {
      console.error('Category save error', error)
      alert('Failed to save category')
    } finally {
      setSubmittingCategory(false)
    }
  }

  const handleCategoryEdit = (category: Category) => {
    setSelectedCategoryId(category.id)
    setCategoryForm({
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
    })
  }

  const handleCategoryDelete = async (categoryId: string) => {
    if (!confirm('Delete this category?')) return
    try {
      const res = await fetch(`/api/reading-library/categories/${categoryId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to delete category')
        return
      }
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(null)
        setCategoryForm({ name: '' })
      }
      await loadCategories()
    } catch (error) {
      console.error('Delete category error', error)
      alert('Failed to delete category')
    }
  }

  const handleResourceUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!resourceFile) {
      alert('Select a file to upload')
      return
    }
    setUploadingResource(true)
    try {
      const formData = new FormData()
      formData.append('file', resourceFile)
      formData.append('title', resourceForm.title || resourceFile.name)
      if (resourceForm.description) formData.append('description', resourceForm.description)
      if (resourceForm.author) formData.append('author', resourceForm.author)
      if (resourceForm.categoryId) formData.append('categoryId', resourceForm.categoryId)
      if (resourceForm.tags) formData.append('tags', resourceForm.tags)
      if (resourceForm.planIds) {
        formData.append('planIds', JSON.stringify(resourceForm.planIds.split(',').map((id) => id.trim()).filter(Boolean)))
      }
      formData.append('type', resourceForm.type)

      const response = await fetch('/api/reading-plans/resources/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        alert(err.error || 'Upload failed')
        return
      }

      setResourceForm({
        planIds: '',
        title: '',
        description: '',
        author: '',
        categoryId: '',
        tags: '',
        type: 'book',
      })
      setResourceFile(null)
      await loadResources()
      alert('Resource uploaded')
    } catch (error) {
      console.error('Resource upload error', error)
      alert('Failed to upload resource')
    } finally {
      setUploadingResource(false)
    }
  }

  const filteredResources = useMemo(() => {
    return resources.map((resource) => ({
      ...resource,
      category: categories.find((cat) => cat.id === resource.categoryId),
    }))
  }, [resources, categories])

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading Reading Library...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-gray-500">Reading Library</p>
          <h1 className="text-3xl font-bold">Global Resources</h1>
          <p className="text-gray-600 mt-2">Manage devotionals, books, and study helps shared across all reading plans.</p>
        </div>
      </header>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Resources" value={resources.length} />
        <StatCard label="Categories" value={categories.length} />
        <StatCard label="Total Storage" value={formatBytes(resources.reduce((sum, resource) => sum + (resource.size || 0), 0))} />
      </section>

      {/* Category manager */}
      <section className="grid lg:grid-cols-[1.1fr_2fr] gap-6">
        <div className="bg-white rounded-2xl shadow p-5 border border-gray-100 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Categories</h2>
            <p className="text-sm text-gray-500">Organize resources by theme, ministry, or format.</p>
          </div>

          <form className="space-y-3" onSubmit={handleCategorySubmit}>
            <div>
              <label className="text-xs font-semibold text-gray-500">Name</label>
              <input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Description</label>
              <textarea
                value={categoryForm.description || ''}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">Color</label>
                <input
                  type="color"
                  value={categoryForm.color || '#4f46e5'}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 h-10"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Icon (emoji)</label>
                <input
                  value={categoryForm.icon || ''}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, icon: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="📖"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submittingCategory}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
              >
                {categoryForm.id ? 'Update Category' : 'Add Category'}
              </button>
              {categoryForm.id && (
                <button
                  type="button"
                  onClick={() => setCategoryForm({ name: '' })}
                  className="px-4 py-2 border rounded-lg text-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Existing Categories</h3>
          </div>
          {categories.length === 0 ? (
            <p className="text-gray-500 text-sm">No categories yet.</p>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    selectedCategoryId === category.id ? 'border-primary-200 bg-primary-50/60' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{category.icon || '📘'}</span>
                      <p className="font-semibold">{category.name}</p>
                    </div>
                    {category.description && <p className="text-sm text-gray-500">{category.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCategoryEdit(category)}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleCategoryDelete(category.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Resource Filters */}
      <section className="bg-white rounded-2xl shadow border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Resources</h2>
            <p className="text-sm text-gray-500">Filter by category or search by title/author.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <input
              placeholder="Search title or author..."
              className="border rounded-lg px-3 py-2 w-full md:w-64"
              value={resourceFilters.search || ''}
              onChange={(e) => setResourceFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
            <select
              className="border rounded-lg px-3 py-2 w-full md:w-48"
              value={resourceFilters.categoryId || ''}
              onChange={(e) => setResourceFilters((prev) => ({ ...prev, categoryId: e.target.value || undefined }))}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">Title</th>
                <th className="py-2">Author</th>
                <th className="py-2">Category</th>
                <th className="py-2">Type</th>
                <th className="py-2">Plans</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    No resources match the filters.
                  </td>
                </tr>
              ) : (
                filteredResources.map((resource) => (
                  <tr key={resource.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{resource.title}</p>
                        {resource.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">{resource.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3">{resource.author || '—'}</td>
                    <td className="py-3">
                      {resource.category ? (
                        <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: `${resource.category.color || '#EEF2FF'}`, color: '#1f2937' }}>
                          {resource.category.name}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3">{resource.type}</td>
                    <td className="py-3 text-xs text-gray-500">{resource.planIds?.join(', ') || '—'}</td>
                    <td className="py-3 text-right">
                      <a
                        href={resource.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline text-sm"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Upload */}
      <section className="bg-white rounded-2xl shadow border border-gray-100 p-5">
        <h2 className="text-xl font-semibold mb-4">Upload Resource</h2>
        <form className="space-y-4" onSubmit={handleResourceUpload}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500">Title</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Devotional Title"
                value={resourceForm.title}
                onChange={(e) => setResourceForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Author</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Optional"
                value={resourceForm.author}
                onChange={(e) => setResourceForm((prev) => ({ ...prev, author: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500">Category</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={resourceForm.categoryId}
                onChange={(e) => setResourceForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              >
                <option value="">Select</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Resource Type</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={resourceForm.type}
                onChange={(e) => setResourceForm((prev) => ({ ...prev, type: e.target.value }))}
              >
                {RESOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Plan IDs (comma separated)</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={resourceForm.planIds}
                onChange={(e) => setResourceForm((prev) => ({ ...prev, planIds: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Tags (comma separated)</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={resourceForm.tags}
              onChange={(e) => setResourceForm((prev) => ({ ...prev, tags: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Description</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
              value={resourceForm.description}
              onChange={(e) => setResourceForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Upload File</label>
            <input
              type="file"
              className="w-full border rounded-lg px-3 py-2"
              onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-gray-500 mt-1">PDF, EPUB, DOC, PPT up to 50MB.</p>
          </div>
          <button
            type="submit"
            disabled={uploadingResource}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
          >
            {uploadingResource ? 'Uploading...' : 'Upload Resource'}
          </button>
        </form>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
      <p className="text-sm text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-semibold mt-2">{value}</p>
    </div>
  )
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
