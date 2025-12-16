'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Church {
  id: string
  name: string
  slug: string
  logo?: string
}

export default function ChurchSwitcher() {
  const router = useRouter()
  const [currentChurch, setCurrentChurch] = useState<Church | null>(null)
  const [availableChurches, setAvailableChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    loadCurrentChurch()
    loadAvailableChurches()
  }, [])

  const loadCurrentChurch = async () => {
    try {
      const response = await fetch('/api/churches/switch')
      const data = await response.json()
      if (data.church) {
        setCurrentChurch(data.church)
      }
    } catch (error) {
      console.error('Error loading current church:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableChurches = async () => {
    try {
      const response = await fetch('/api/churches')
      const data = await response.json()
      setAvailableChurches(data)
    } catch (error) {
      console.error('Error loading churches:', error)
    }
  }

  const handleSwitch = async (churchId: string) => {
    if (churchId === currentChurch?.id) return

    setSwitching(true)
    try {
      const response = await fetch('/api/churches/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId }),
      })

      if (response.ok) {
        const data = await response.json()
        const church = availableChurches.find((c) => c.id === churchId)
        if (church) {
          setCurrentChurch(church)
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Error switching church:', error)
    } finally {
      setSwitching(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-600">Loading...</div>
  }

  if (!currentChurch) {
    return null
  }

  return (
    <div className="w-full px-2">
      <select
        value={currentChurch.id}
        onChange={(e) => handleSwitch(e.target.value)}
        disabled={switching}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 truncate"
        title={currentChurch.name}
      >
        {availableChurches.map((church) => (
          <option key={church.id} value={church.id}>
            {church.name}
          </option>
        ))}
      </select>
    </div>
  )
}

