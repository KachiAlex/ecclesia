'use client'

import { useCallback, useEffect, useState } from 'react'

interface LeaderboardEntry {
  rank: number
  id: string
  firstName: string
  lastName: string
  profileImage?: string
  xp: number
  level: number
  badges: Array<{
    badge: {
      name: string
      icon?: string
    }
  }>
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [type, setType] = useState<'global' | 'department' | 'group' | 'family'>('global')
  const [loading, setLoading] = useState(true)

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(`/api/gamification/leaderboard?type=${type}`)
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data)
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    loadLeaderboard()
  }, [loadLeaderboard])

  if (loading) {
    return <div className="text-center py-8">Loading leaderboard...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <div className="flex gap-2">
          {['global', 'department', 'group', 'family'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t as any)}
              className={`px-4 py-2 rounded-lg capitalize ${
                type === t
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Leaderboard Data Yet</h3>
          <p className="text-gray-600">
            Start engaging with sermons, prayer, giving, and events to earn XP and appear on the leaderboard!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    XP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Badges
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((entry) => (
                <tr key={entry.id} className={entry.rank <= 3 ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                        {entry.profileImage ? (
                          <img
                            src={entry.profileImage}
                            alt={`${entry.firstName} ${entry.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-primary-600 font-medium">
                            {entry.firstName[0]}{entry.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {entry.firstName} {entry.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full font-semibold">
                      Level {entry.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {entry.xp.toLocaleString()} XP
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      {entry.badges.slice(0, 5).map((ub, idx) => (
                        <span key={idx} className="text-2xl" title={ub.badge.name}>
                          {ub.badge.icon || '🏅'}
                        </span>
                      ))}
                      {entry.badges.length > 5 && (
                        <span className="text-sm text-gray-500">
                          +{entry.badges.length - 5}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

