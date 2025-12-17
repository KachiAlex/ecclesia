'use client'

import { useState, useEffect, useRef } from 'react'
import { formatDate } from '@/lib/utils'

interface Post {
  id: string
  content: string
  type: string
  images: string[]
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  isLiked: boolean
  _count: {
    likes: number
    comments: number
  }
}

interface User {
  id: string
  firstName: string
  lastName: string
  profileImage?: string
}

export default function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  
  // Post creation states
  const [postContent, setPostContent] = useState('')
  const [postType, setPostType] = useState('Update')
  const [images, setImages] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [charCount, setCharCount] = useState(0)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadCurrentUser()
    loadPosts()
  }, [])

  useEffect(() => {
    setCharCount(postContent.length)
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [postContent])

  const loadCurrentUser = async () => {
    try {
      const response = await fetch('/api/users/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const loadPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      if (response.ok) {
        const data = await response.json()
        const rawPosts = Array.isArray(data?.posts) ? data.posts : []
        const normalized = rawPosts.map((p: any) => {
          const images = Array.isArray(p?.images) ? p.images : []
          const count = p?._count || {}
          return {
            ...p,
            images,
            isLiked: Boolean(p?.isLiked),
            _count: {
              likes: Number(count.likes || 0),
              comments: Number(count.comments || 0),
            },
          } as Post
        })
        setPosts(normalized)
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error('Error loading posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!postContent.trim()) return

    setIsPosting(true)
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: postContent,
          type: postType,
          images,
        }),
      })

      if (response.ok) {
        setPostContent('')
        setImages([])
        setPostType('Update')
        setIsExpanded(false)
        loadPosts()
      }
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setIsPosting(false)
    }
  }

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked: data.liked,
                  _count: {
                    ...post._count,
                    likes: data.liked
                      ? post._count.likes + 1
                      : post._count.likes - 1,
                  },
                }
              : post
          )
        )
      }
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const addImage = () => {
    if (imageUrl.trim() && !images.includes(imageUrl.trim())) {
      setImages([...images, imageUrl.trim()])
      setImageUrl('')
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const postTypes = [
    { value: 'Update', icon: '', color: 'bg-blue-50 text-blue-700' },
    { value: 'Testimony', icon: '', color: 'bg-purple-50 text-purple-700' },
    { value: 'Announcement', icon: '', color: 'bg-orange-50 text-orange-700' },
    { value: 'Prayer Request', icon: '', color: 'bg-green-50 text-green-700' },
  ]

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading community feed...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Create Post Box */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex gap-4">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            {currentUser?.profileImage ? (
              <img
                src={currentUser.profileImage}
                alt={`${currentUser.firstName} ${currentUser.lastName}`}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
                {currentUser && getInitials(currentUser.firstName, currentUser.lastName)}
              </div>
            )}
          </div>

          {/* Post Input */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder={`What's on your mind, ${currentUser?.firstName}?`}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-primary-500 transition-all text-gray-800 placeholder-gray-400"
              rows={isExpanded ? 4 : 1}
              style={{ minHeight: isExpanded ? '100px' : '48px' }}
            />

            {/* Expanded Options */}
            {isExpanded && (
              <div className="mt-4 space-y-4">
                {/* Post Type Pills */}
                <div className="flex flex-wrap gap-2">
                  {postTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setPostType(type.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        postType === type.value
                          ? type.color + ' ring-2 ring-offset-2 ring-primary-500'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type.value}
                    </button>
                  ))}
                </div>

                {/* Add Image Section */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste image URL..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-gray-700 font-medium"
                  >
                     Add Photo
                  </button>
                </div>

                {/* Image Previews */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    {charCount > 0 && (
                      <span className={charCount > 500 ? 'text-red-500 font-medium' : ''}>
                        {charCount} {charCount > 500 && '/ 500'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setIsExpanded(false)
                        setPostContent('')
                        setImages([])
                        setPostType('Update')
                      }}
                      className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePost}
                      disabled={!postContent.trim() || isPosting || charCount > 500}
                      className="px-6 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none transition-all font-semibold"
                    >
                      {isPosting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4"></div>
            <p className="text-gray-600 text-lg">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Post Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  {/* User Avatar */}
                  {post.user.profileImage ? (
                    <img
                      src={post.user.profileImage}
                      alt={`${post.user.firstName} ${post.user.lastName}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
                      {getInitials(post.user.firstName, post.user.lastName)}
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {post.user.firstName} {post.user.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        postTypes.find(t => t.value === post.type)?.color || 'bg-gray-100 text-gray-600'
                      }`}>
                        {postTypes.find(t => t.value === post.type)?.icon} {post.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mt-4">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                </div>
              </div>

              {/* Post Images */}
              {((post as any)?.images || []).length > 0 && (
                <div className={`grid ${((post as any)?.images || []).length === 1 ? 'grid-cols-1' : ((post as any)?.images || []).length === 2 ? 'grid-cols-2' : 'grid-cols-2'} gap-1`}>
                  {((post as any)?.images || []).slice(0, 4).map((img: string, idx: number) => (
                    <div key={idx} className="relative aspect-square">
                      <img
                        src={img}
                        alt={`Post image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 3 && ((post as any)?.images || []).length > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">
                            +{((post as any)?.images || []).length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Post Actions */}
              <div className="p-6 pt-4">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>{post._count.likes} likes</span>
                  <span>{post._count.comments} comments</span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
                      post.isLiked
                        ? 'text-primary-600 bg-primary-50 hover:bg-primary-100'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {post.isLiked ? '' : ''} Like
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-all">
                     Comment
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-all">
                     Share
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}


