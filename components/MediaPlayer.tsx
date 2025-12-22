'use client'

import { useEffect, useRef, useState } from 'react'

const isTelegramUrl = (url: string) => url.includes('t.me/') || url.includes('telegram.')

const isPublicTelegramPostUrl = (url: string) => {
  if (!url.includes('t.me/')) return false
  return /t\.me\/(?!c\/)[^\/]+\/\d+/.test(url)
}

const detectEmbedType = (url: string): 'youtube' | 'vimeo' | 'telegram' | 'direct' => {
  if (url.includes('youtube.com/embed/') || url.includes('youtu.be')) {
    return 'youtube'
  }
  if (url.includes('vimeo.com') || url.includes('player.vimeo.com')) {
    return 'vimeo'
  }
  if (isPublicTelegramPostUrl(url)) {
    return 'telegram'
  }
  return 'direct'
}

interface MediaPlayerProps {
  videoUrl?: string
  audioUrl?: string
  thumbnailUrl?: string
  title: string
  onTimeUpdate?: (currentTime: number) => void
  initialTime?: number
}

export default function MediaPlayer({
  videoUrl,
  audioUrl,
  thumbnailUrl,
  title,
  onTimeUpdate,
  initialTime = 0,
}: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [mediaType, setMediaType] = useState<'video' | 'audio'>('video')
  const [embedType, setEmbedType] = useState<'youtube' | 'vimeo' | 'telegram' | 'direct' | null>(null)
  const [unsupportedTelegram, setUnsupportedTelegram] = useState(false)

  useEffect(() => {
    // Determine media type and embed type
    if (videoUrl) {
      setMediaType('video')
      setUnsupportedTelegram(false)
      const type = detectEmbedType(videoUrl)
      setEmbedType(type)
      if (type === 'direct' && isTelegramUrl(videoUrl)) {
        setUnsupportedTelegram(true)
      }
    } else if (audioUrl) {
      setMediaType('audio')
      setEmbedType('direct')
      setUnsupportedTelegram(false)
    }
  }, [videoUrl, audioUrl])

  useEffect(() => {
    // Set initial time when metadata is loaded
    if (embedType === 'direct') {
      const ref = mediaType === 'video' ? videoRef : audioRef
      if (ref.current && initialTime > 0) {
        const handleLoadedMetadata = () => {
          if (ref.current) {
            ref.current.currentTime = initialTime
          }
        }
        ref.current.addEventListener('loadedmetadata', handleLoadedMetadata)
        return () => {
          ref.current?.removeEventListener('loadedmetadata', handleLoadedMetadata)
        }
      }
    }
  }, [embedType, mediaType, initialTime])

  const handleTimeUpdate = () => {
    if (onTimeUpdate) {
      const currentTime =
        mediaType === 'video'
          ? videoRef.current?.currentTime || 0
          : audioRef.current?.currentTime || 0
      onTimeUpdate(currentTime)
    }
  }

  const getYouTubeEmbedUrl = (url: string): string => {
    // If already an embed URL, add timestamp
    if (url.includes('/embed/')) {
      return initialTime > 0 ? `${url}?start=${Math.floor(initialTime)}` : url
    }
    
    // Extract video ID and create embed URL
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)
    if (match) {
      const videoId = match[1]
      const startParam = initialTime > 0 ? `?start=${Math.floor(initialTime)}` : ''
      return `https://www.youtube.com/embed/${videoId}${startParam}`
    }
    return url
  }

  const getVimeoEmbedUrl = (url: string): string => {
    if (url.includes('player.vimeo.com')) {
      return url
    }
    
    const match = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/)
    if (match) {
      const videoId = match[3]
      return `https://player.vimeo.com/video/${videoId}`
    }
    return url
  }

  const getTelegramEmbedUrl = (url: string): string => {
    // Telegram embed format
    if (url.includes('t.me/')) {
      // Convert t.me links to embed format if needed
      const match = url.match(/t\.me\/(?!c\/)([^\/]+)\/(\d+)/)
      if (match) {
        return `https://t.me/${match[1]}/${match[2]}?embed=1`
      }
    }
    return url
  }

  if (!videoUrl && !audioUrl) {
    return (
      <div className="w-full h-96 bg-black flex items-center justify-center text-white">
        <p>No media available</p>
      </div>
    )
  }

  // Render based on embed type
  if (mediaType === 'video' && videoUrl) {
    if (unsupportedTelegram) {
      return (
        <div className="w-full h-96 bg-black flex items-center justify-center text-white px-6 text-center">
          <p>
            This Telegram link can’t be embedded. Please use a public post link in the format
            {' '}
            <span className="font-mono">t.me/&lt;channel&gt;/&lt;postId&gt;</span>
            {' '}
            or upload the video/audio file directly.
          </p>
        </div>
      )
    }

    if (embedType === 'youtube') {
      return (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 */ }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={getYouTubeEmbedUrl(videoUrl)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }

    if (embedType === 'vimeo') {
      return (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={getVimeoEmbedUrl(videoUrl)}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }

    if (embedType === 'telegram') {
      return (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={getTelegramEmbedUrl(videoUrl)}
            title={title}
            allowFullScreen
          />
        </div>
      )
    }

    // Direct video
    return (
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        className="w-full"
        onTimeUpdate={handleTimeUpdate}
        poster={thumbnailUrl}
      >
        Your browser does not support the video tag.
      </video>
    )
  }

  // Audio player
  if (audioUrl) {
    return (
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-8">
        <div className="max-w-md mx-auto">
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full rounded-lg mb-4 shadow-lg"
            />
          )}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              className="w-full"
              onTimeUpdate={handleTimeUpdate}
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        </div>
      </div>
    )
  }

  return null
}

