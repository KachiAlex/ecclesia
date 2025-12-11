'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'
import CreatePrayerRequest from './CreatePrayerRequest'

interface PrayerRequest {
  id: string
  title: string
  content: string
  status: string
  isAnonymous: boolean
  createdAt: string
  user?: {
    id: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  hasPrayed: boolean
  _count: {
    interactions: number
  }
}

export default function PrayerWall() {
  const [requests, setRequests] = useState<PrayerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    loadRequests()
  }, [filter])

  const loadRequests = async () => {
    try {
      const params = new URLSearchParams()
      if (filter) params.append('status', filter)

      const response = await fetch(`/api/prayer/requests?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Error loading prayer requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePray = async (requestId: string) => {
    try {
      const response = await fetch(`/api/prayer/requests/${requestId}/pray`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  hasPrayed: !req.hasPrayed,
                  _count: {
                    ...req._count,
                    interactions: req.hasPrayed
                      ? req._count.interactions - 1
                      : req._count.interactions + 1,
                  },
                }
              : req
          )
        )
      }
    } catch (error) {
      console.error('Error recording prayer:', error)
    }
  }

  const handleRequestCreated = () => {
    setShowCreate(false)
    loadRequests()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading prayer wall...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prayer Wall</h1>
          <p className="text-gray-600">
            Share your prayer requests and pray for others
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Request Prayer
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
          onClick={() => setFilter('ACTIVE')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'ACTIVE'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('ANSWERED')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'ANSWERED'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Answered
        </button>
      </div>

      {/* Create Prayer Request Modal */}
      {showCreate && (
        <CreatePrayerRequest
          onClose={() => setShowCreate(false)}
          onSuccess={handleRequestCreated}
        />
      )}

      {/* Prayer Requests */}
      <div className="space-y-6">
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No prayer requests yet. Be the first to share!</p>
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className={`bg-white rounded-lg shadow-lg p-6 ${
                request.status === 'ANSWERED'
                  ? 'border-l-4 border-green-500'
                  : ''
              }`}
            >
              {/* Request Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {!request.isAnonymous && request.user && (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                      {request.user.profileImage ? (
                        <img
                          src={request.user.profileImage}
                          alt={`${request.user.firstName} ${request.user.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-primary-600 font-medium">
                          {request.user.firstName[0]}{request.user.lastName[0]}
                        </span>
                      )}
                    </div>
                  )}
                  <div>
                    {request.isAnonymous ? (
                      <div className="font-medium text-gray-600">Anonymous</div>
                    ) : (
                      <div className="font-medium">
                        {request.user?.firstName} {request.user?.lastName}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    request.status === 'ANSWERED'
                      ? 'bg-green-100 text-green-800'
                      : request.status === 'ACTIVE'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {request.status}
                </span>
              </div>

              {/* Request Content */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{request.title}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{request.content}</p>
              </div>

              {/* Prayer Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  onClick={() => handlePray(request.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    request.hasPrayed
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">🙏</span>
                  <span>
                    {request.hasPrayed ? 'I Prayed' : 'I Will Pray'}
                  </span>
                </button>
                <div className="text-sm text-gray-600">
                  {request._count.interactions} people prayed
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

