'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface InviteDetails {
  unit: {
    id: string
    name: string
    description?: string
  }
  church: {
    id: string
    name: string
  }
  invitedBy: {
    id: string
    firstName?: string
    lastName?: string
    email?: string
  }
}

export default function UnitInvitePage({ params }: { params: { token: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      // Redirect to login with return URL
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`)
      return
    }

    loadInviteDetails()
  }, [session, status, params.token])

  const loadInviteDetails = async () => {
    try {
      const res = await fetch(`/api/invite/unit/${params.token}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load invite details')
      }
      
      setInviteDetails(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load invite')
    } finally {
      setLoading(false)
    }
  }

  const acceptInvite = async () => {
    setAccepting(true)
    setError('')
    
    try {
      const res = await fetch(`/api/invite/unit/${params.token}/accept`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invite')
      }
      
      // Redirect to the group
      router.push(`/groups/${data.unitId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to accept invite')
    } finally {
      setAccepting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading invite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invite</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/groups')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Go to Groups
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!inviteDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600">Invite not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">You're Invited!</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {inviteDetails.invitedBy.firstName || inviteDetails.invitedBy.lastName 
                ? `${inviteDetails.invitedBy.firstName} ${inviteDetails.invitedBy.lastName}`.trim()
                : inviteDetails.invitedBy.email
              } has invited you to join:
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-900">{inviteDetails.unit.name}</h2>
            {inviteDetails.unit.description && (
              <p className="text-sm text-gray-600 mt-1">{inviteDetails.unit.description}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Part of {inviteDetails.church.name}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push('/groups')}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Decline
            </button>
            <button
              onClick={acceptInvite}
              disabled={accepting}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {accepting ? 'Joining...' : 'Accept Invite'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}