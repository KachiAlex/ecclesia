'use client'

import { useState } from 'react'
import QRCode from 'qrcode'

interface Child {
  id: string
  firstName: string
  lastName: string
  isCheckedIn: boolean
  checkInInfo?: {
    qrCode: string
  } | null
}

interface ChildrenCheckInProps {
  child: Child
  onClose: () => void
}

export default function ChildrenCheckIn({ child, onClose }: ChildrenCheckInProps) {
  const [processing, setProcessing] = useState(false)
  const [qrImage, setQrImage] = useState<string>('')
  const [error, setError] = useState('')

  const handleCheckIn = async () => {
    setProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/children/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: child.id,
          action: child.isCheckedIn ? 'checkout' : 'checkin',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Check-in failed')
      }

      const data = await response.json()

      // Generate QR code image if checking in
      if (!child.isCheckedIn && data.qrCode) {
        const qr = await QRCode.toDataURL(data.qrCode, {
          width: 200,
          margin: 2,
        })
        setQrImage(qr)
      } else {
        onClose()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {child.isCheckedIn ? 'Check Out' : 'Check In'} {child.firstName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          {qrImage && !child.isCheckedIn ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-medium mb-2">
                  ✓ {child.firstName} is checked in!
                </p>
                <p className="text-sm text-green-700">
                  Show this QR code when picking up
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 mb-4">
                <img src={qrImage} alt="Check-in QR Code" className="mx-auto" />
              </div>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Done
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-700 mb-6">
                {child.isCheckedIn
                  ? `Are you ready to check out ${child.firstName}?`
                  : `Check in ${child.firstName} for children's ministry?`}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleCheckIn}
                  disabled={processing}
                  className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {processing
                    ? 'Processing...'
                    : child.isCheckedIn
                    ? 'Check Out'
                    : 'Check In'}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

