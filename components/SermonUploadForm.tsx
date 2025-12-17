'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface UploadProgress {
  video?: number
  audio?: number
  thumbnail?: number
}

export default function SermonUploadForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({})
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('url')
  
  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [speaker, setSpeaker] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  
  // URLs
  const [videoUrl, setVideoUrl] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  
  // Files
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  
  const [mediaType, setMediaType] = useState<'video' | 'audio' | 'both'>('both')
  const [duration, setDuration] = useState('')

  const videoFileRef = useRef<HTMLInputElement>(null)
  const audioFileRef = useRef<HTMLInputElement>(null)
  const thumbnailFileRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (
    file: File,
    type: 'video' | 'audio' | 'thumbnail'
  ): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const response = await fetch('/api/sermons/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    const data = await response.json()
    return data.url
  }

  const parseMediaUrl = (url: string): {
    type: 'youtube' | 'vimeo' | 'telegram' | 'direct'
    embedUrl?: string
  } => {
    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
    const youtubeMatch = url.match(youtubeRegex)
    if (youtubeMatch) {
      const videoId = youtubeMatch[1]
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      }
    }

    // Vimeo
    const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/
    const vimeoMatch = url.match(vimeoRegex)
    if (vimeoMatch) {
      const videoId = vimeoMatch[3]
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
      }
    }

    // Telegram
    if (url.includes('t.me/') || url.includes('telegram.')) {
      // Private/internal Telegram links (t.me/c/<id>/<postId>) cannot be embedded publicly
      if (/t\.me\/c\/\d+\/\d+/.test(url)) {
        return {
          type: 'telegram',
        }
      }
      return {
        type: 'telegram',
        embedUrl: url,
      }
    }

    // Direct URL
    return {
      type: 'direct',
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let finalVideoUrl = videoUrl
      let finalAudioUrl = audioUrl
      let finalThumbnailUrl = thumbnailUrl

      // Upload files if method is 'file'
      if (uploadMethod === 'file') {
        if (videoFile) {
          setUploadProgress((prev) => ({ ...prev, video: 0 }))
          finalVideoUrl = await handleFileUpload(videoFile, 'video')
          setUploadProgress((prev) => ({ ...prev, video: 100 }))
        }

        if (audioFile) {
          setUploadProgress((prev) => ({ ...prev, audio: 0 }))
          finalAudioUrl = await handleFileUpload(audioFile, 'audio')
          setUploadProgress((prev) => ({ ...prev, audio: 100 }))
        }

        if (thumbnailFile) {
          setUploadProgress((prev) => ({ ...prev, thumbnail: 0 }))
          finalThumbnailUrl = await handleFileUpload(thumbnailFile, 'thumbnail')
          setUploadProgress((prev) => ({ ...prev, thumbnail: 100 }))
        }
      } else {
        // For URL method, convert YouTube/Vimeo/Telegram URLs to embed URLs
        if (finalVideoUrl) {
          const parsed = parseMediaUrl(finalVideoUrl)
          if (parsed.type === 'telegram' && !parsed.embedUrl) {
            throw new Error(
              'This Telegram link cannot be embedded (t.me/c/...). Please copy the public link in the format t.me/<channel>/<postId>.'
            )
          }
          if (parsed.embedUrl) {
            finalVideoUrl = parsed.embedUrl
          }
        }
      }

      // Create sermon
      const response = await fetch('/api/sermons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          speaker,
          videoUrl: finalVideoUrl || undefined,
          audioUrl: finalAudioUrl || undefined,
          thumbnailUrl: finalThumbnailUrl || undefined,
          duration: duration ? parseInt(duration) * 60 : undefined, // Convert minutes to seconds
          category: category || undefined,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create sermon')
      }

      const sermon = await response.json()
      alert('Sermon uploaded successfully!')
      router.push('/sermons')
    } catch (error: any) {
      console.error('Error uploading sermon:', error)
      alert(error.message || 'Failed to upload sermon')
    } finally {
      setLoading(false)
      setUploadProgress({})
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Sermon Details</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Enter sermon title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Speaker *
            </label>
            <input
              type="text"
              required
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Pastor name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Sermon description, key points, scripture references..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Detailed description helps AI generate better summaries
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select category</option>
                <option value="Sunday Service">Sunday Service</option>
                <option value="Bible Study">Bible Study</option>
                <option value="Prayer Meeting">Prayer Meeting</option>
                <option value="Special Event">Special Event</option>
                <option value="Youth Service">Youth Service</option>
                <option value="Testimony">Testimony</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 45"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., faith, prayer, healing"
            />
          </div>
        </div>
      </div>

      {/* Media Upload */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Media Upload</h2>

        {/* Upload Method Toggle */}
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setUploadMethod('url')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              uploadMethod === 'url'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📎 URL / Link
          </button>
          <button
            type="button"
            onClick={() => setUploadMethod('file')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              uploadMethod === 'file'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📁 File Upload
          </button>
        </div>

        {uploadMethod === 'url' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video URL
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="YouTube, Vimeo, Telegram, or direct video link"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supports: YouTube, Vimeo, Telegram, or direct MP4/WebM links
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audio URL (optional)
              </label>
              <input
                type="url"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Direct audio link (MP3, WAV, etc.)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail URL (optional)
              </label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Sermon thumbnail image"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video File (MP4, WebM, MOV)
              </label>
              <input
                ref={videoFileRef}
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              {videoFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
              {uploadProgress.video !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress.video}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Uploading video: {uploadProgress.video}%
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audio File (MP3, WAV, M4A)
              </label>
              <input
                ref={audioFileRef}
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              {audioFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
              {uploadProgress.audio !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress.audio}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Uploading audio: {uploadProgress.audio}%
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail Image (JPG, PNG)
              </label>
              <input
                ref={thumbnailFileRef}
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              {thumbnailFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {thumbnailFile.name} ({(thumbnailFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
              {uploadProgress.thumbnail !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress.thumbnail}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Uploading thumbnail: {uploadProgress.thumbnail}%
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>File size limits:</strong> Video - 500MB, Audio - 100MB, Thumbnail - 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !title || !speaker || (uploadMethod === 'url' ? !videoUrl && !audioUrl : !videoFile && !audioFile)}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Upload Sermon'}
        </button>
      </div>
    </form>
  )
}

