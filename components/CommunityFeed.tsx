'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'
import CreatePost from './CreatePost'

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

export default function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    loadPosts()
  }, [filter])

  const loadPosts = async () => {
    try {
      const params = new URLSearchParams()
      if (filter) params.append('type', filter)

      const response = await fetch(`/api/posts?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
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

  const handlePostCreated = () => {
    setShowCreatePost(false)
    loadPosts()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading feed...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Community Feed</h1>
        <button
          onClick={() => setShowCreatePost(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Create Post
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-lg ${
            filter === ''
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('Update')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'Update'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Updates
        </button>
        <button
          onClick={() => setFilter('Testimony')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'Testimony'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Testimonies
        </button>
        <button
          onClick={() => setFilter('Announcement')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'Announcement'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Announcements
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePost onClose={() => setShowCreatePost(false)} onSuccess={handlePostCreated} />
      )}

      {/* Posts */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-lg p-6">
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                  {post.user.profileImage ? (
                    <img
                      src={post.user.profileImage}
                      alt={`${post.user.firstName} ${post.user.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-primary-600 font-medium">
                      {post.user.firstName[0]}{post.user.lastName[0]}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-medium">
                    {post.user.firstName} {post.user.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(post.createdAt)}
                  </div>
                </div>
                <div className="ml-auto">
                  <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm">
                    {post.type}
                  </span>
                </div>
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Post Images */}
              {post.images.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {post.images.map((image, idx) => (
                    <img
                      key={idx}
                      src={image}
                      alt={`Post image ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center gap-6 pt-4 border-t">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 ${
                    post.isLiked ? 'text-primary-600' : 'text-gray-600'
                  }`}
                >
                  <span className="text-xl">{post.isLiked ? '❤️' : '🤍'}</span>
                  <span>{post._count.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600">
                  <span className="text-xl">💬</span>
                  <span>{post._count.comments}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

