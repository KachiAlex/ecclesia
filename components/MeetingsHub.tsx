'use client'

import { useState } from 'react'
import LivestreamHub from '@/components/LivestreamHub'

export default function MeetingsHub({ isAdmin }: { isAdmin: boolean }) {
  const [tab, setTab] = useState<'schedule' | 'livestream'>('schedule')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meetings</h1>
        <p className="text-gray-600 mt-1">Schedule meetings and manage livestream.</p>
      </div>

      <div className="bg-white rounded-xl border p-2 flex gap-2 w-fit">
        <button
          type="button"
          onClick={() => setTab('schedule')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'schedule' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Schedule
        </button>
        <button
          type="button"
          onClick={() => setTab('livestream')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'livestream' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Livestream
        </button>
      </div>

      {tab === 'schedule' ? (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Scheduled Meetings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Coming next: recurring meetings, branch scope, and Google Meet + Calendar integration.
          </p>
        </div>
      ) : (
        <LivestreamHub isAdmin={isAdmin} />
      )}
    </div>
  )
}
