'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDate } from '@/lib/utils'

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
    email: string
    profileImage?: string
  }
  prayerCount: number
}

export default function PrayerAdminDashboard() {
  const [requests, setRequests] = useState<PrayerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'answered'>('active')
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      const status = activeTab === 'active' ? 'ACTIVE' : 'ANSWERED'
      const response = await fetch(`/api/prayer/requests?status=${status}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Error loading prayer requests:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const handleMarkAsAnswered = async (requestId: string) => {
    try {
      const response = await fetch(`/api/prayer/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ANSWERED' }),
      })

      if (response.ok) {
        setRequests((prev) => prev.filter((req) => req.id !== requestId))
        setShowDetails(false)
        alert('Prayer marked as answered!')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const handleReactivate = async (requestId: string) => {
    try {
      const response = await fetch(`/api/prayer/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      })

      if (response.ok) {
        setRequests((prev) => prev.filter((req) => req.id !== requestId))
        setShowDetails(false)
        alert('Prayer reactivated!')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this prayer request?')) {
      return
    }

    try {
      const response = await fetch(`/api/prayer/requests/${requestId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setRequests((prev) => prev.filter((req) => req.id !== requestId))
        setShowDetails(false)
        alert('Prayer request deleted')
      }
    } catch (error) {
      console.error('Error deleting request:', error)
      alert('Failed to delete request')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading prayer requests...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Prayer Management</h1>
        <p className="text-gray-600">
          View and manage prayer requests from your congregation
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Active Requests
            {activeTab === 'active' && (
              <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-600 rounded-full text-xs">
                {requests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('answered')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'answered'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Answered Prayers
            {activeTab === 'answered' && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                {requests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">
              {activeTab === 'active'
                ? 'No active prayer requests'
                : 'No answered prayers yet'}
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className={`bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer ${
                activeTab === 'answered' ? 'border-l-4 border-green-500' : ''
              }`}
              onClick={() => {
                setSelectedRequest(request)
                setShowDetails(true)
              }}
            >
              {/* Request Header */}
              <div className="flex items-center gap-3 mb-4">
                {!request.isAnonymous && request.user && (
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {request.user.profileImage ? (
                      <img
                        src={request.user.profileImage}
                        alt={`${request.user.firstName} ${request.user.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-primary-600 font-medium text-lg">
                        {request.user.firstName[0]}{request.user.lastName[0]}
                      </span>
                    )}
                  </div>
                )}
                {request.isAnonymous && (
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 font-medium text-lg">?</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {request.isAnonymous ? (
                    <div className="font-medium text-gray-600">Anonymous</div>
                  ) : (
                    <div className="font-medium truncate">
                      {request.user?.firstName} {request.user?.lastName}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {formatDate(request.createdAt)}
                  </div>
                </div>
              </div>

              {/* Request Content */}
              <div className="mb-4">
                <h3 className="font-semibold mb-1 line-clamp-2">{request.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-3">{request.content}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <span>🙏</span>
                  <span>{request.prayerCount} prayers</span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activeTab === 'answered'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {request.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Prayer Request Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Request Info */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  {!selectedRequest.isAnonymous && selectedRequest.user && (
                    <>
                      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                        {selectedRequest.user.profileImage ? (
                          <img
                            src={selectedRequest.user.profileImage}
                            alt={`${selectedRequest.user.firstName} ${selectedRequest.user.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-primary-600 font-medium text-xl">
                            {selectedRequest.user.firstName[0]}{selectedRequest.user.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-lg">
                          {selectedRequest.user.firstName} {selectedRequest.user.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{selectedRequest.user.email}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Posted {formatDate(selectedRequest.createdAt)}
                        </div>
                      </div>
                    </>
                  )}
                  {selectedRequest.isAnonymous && (
                    <div>
                      <div className="font-medium text-lg text-gray-600">Anonymous Request</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Posted {formatDate(selectedRequest.createdAt)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-lg mb-2">{selectedRequest.title}</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRequest.content}</p>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span>🙏</span>
                    <span className="font-medium">{selectedRequest.prayerCount} people prayed</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedRequest.status === 'ANSWERED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {selectedRequest.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleMarkAsAnswered(selectedRequest.id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    ✓ Mark as Answered
                  </button>
                )}
                {selectedRequest.status === 'ANSWERED' && (
                  <button
                    onClick={() => handleReactivate(selectedRequest.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    ↻ Reactivate
                  </button>
                )}
                <button
                  onClick={() => handleDeleteRequest(selectedRequest.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

