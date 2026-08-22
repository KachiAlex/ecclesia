'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'

interface MembershipData {
  user: {
    id: string
    name: string
    email: string
    role: string
    profileImage?: string
  }
  church: {
    id: string
    name: string
    logo?: string
  }
  qrCode: string
  memberSince: string
}

export default function MembershipCard() {
  const [data, setData] = useState<MembershipData | null>(null)
  const [qrImage, setQrImage] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCard()
  }, [])

  const loadCard = async () => {
    try {
      const response = await fetch('/api/membership/card')
      if (response.ok) {
        const cardData = await response.json()
        setData(cardData)

        // Generate QR code image
        if (cardData.qrCode) {
          const qr = await QRCode.toDataURL(cardData.qrCode, {
            width: 200,
            margin: 2,
          })
          setQrImage(qr)
        }
      }
    } catch (error) {
      console.error('Error loading membership card:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading membership card...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Failed to load membership card</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-3xl font-bold mb-6">Digital Membership Card</h1>

      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg shadow-xl p-8 text-white">
        {/* Church Logo */}
        {data.church.logo && (
          <div className="mb-4 flex justify-center">
            <img
              src={data.church.logo}
              alt={data.church.name}
              className="h-16 w-auto"
            />
          </div>
        )}

        {/* Member Info */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-white mx-auto mb-4 flex items-center justify-center overflow-hidden">
            {data.user.profileImage ? (
              <img
                src={data.user.profileImage}
                alt={data.user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-primary-600 text-3xl font-bold">
                {data.user.name.split(' ').map((n) => n[0]).join('')}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold mb-2">{data.user.name}</h2>
          <p className="text-primary-100">{data.church.name}</p>
          <p className="text-sm text-primary-200 mt-1">{data.user.role}</p>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-lg p-4 flex justify-center">
          {qrImage ? (
            <img src={qrImage} alt="Membership QR Code" className="w-48 h-48" />
          ) : (
            <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
              <p className="text-gray-500">QR Code</p>
            </div>
          )}
        </div>

        {/* Member Since */}
        <div className="mt-6 text-center text-sm text-primary-100">
          Member since {new Date(data.memberSince).toLocaleDateString()}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>How to use:</strong> Show this QR code at events, check-ins, bookstore, and other church services.
        </p>
      </div>
    </div>
  )
}

