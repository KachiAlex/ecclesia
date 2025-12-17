'use client'

import { useEffect, useMemo, useState } from 'react'

type AttendanceSession = {
  id: string
  branchId?: string
  title: string
  type: string
  mode: string
  startAt: string
  location?: string
  notes?: string
  headcount?: any
  checkInCount?: number
}

type AttendanceRecord = {
  id: string
  userId?: string
  guestName?: string
  channel: string
  checkedInAt: string
}

export default function AttendanceHub({ isManager }: { isManager: boolean }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [branchId, setBranchId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    type: 'SERVICE',
    mode: 'OFFLINE',
    startAt: new Date().toISOString().slice(0, 16),
    location: '',
    notes: '',
  })

  const [headcountSaving, setHeadcountSaving] = useState(false)
  const [headcount, setHeadcount] = useState({ total: '', men: '', women: '', children: '', firstTimers: '' })

  const [checkInSaving, setCheckInSaving] = useState(false)
  const [checkInForm, setCheckInForm] = useState({ userId: '', guestName: '', channel: 'OFFLINE' })

  const queryString = useMemo(() => {
    const qs = new URLSearchParams()
    if (branchId.trim()) qs.set('branchId', branchId.trim())
    if (start) qs.set('start', new Date(start).toISOString())
    if (end) qs.set('end', new Date(end).toISOString())
    const s = qs.toString()
    return s ? `?${s}` : ''
  }, [branchId, start, end])

  async function readApiError(res: Response) {
    try {
      const json = await res.json()
      return json?.error || 'Request failed'
    } catch {
      try {
        const text = await res.text()
        return text || 'Request failed'
      } catch {
        return 'Request failed'
      }
    }
  }

  async function loadSessions() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/attendance/sessions${queryString}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(await readApiError(res))
      const json = await res.json()
      setSessions(json.sessions || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function loadRecords(sessionId: string) {
    setError(null)
    try {
      const res = await fetch(`/api/attendance/sessions/${sessionId}/records`, { cache: 'no-store' })
      if (!res.ok) throw new Error(await readApiError(res))
      const json = await res.json()
      setRecords(json.records || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load records')
    }
  }

  useEffect(() => {
    loadSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString])

  if (!isManager) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-gray-600 mt-2">You do not have access to Attendance management.</p>
      </div>
    )
  }

  async function createSession() {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/attendance/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          branchId: branchId.trim() || null,
          title: createForm.title,
          type: createForm.type,
          mode: createForm.mode,
          startAt: new Date(createForm.startAt).toISOString(),
          location: createForm.location || null,
          notes: createForm.notes || null,
        }),
      })
      if (!res.ok) throw new Error(await readApiError(res))
      setCreateForm((p) => ({ ...p, title: '', location: '', notes: '' }))
      await loadSessions()
    } catch (e: any) {
      setError(e?.message || 'Failed')
    } finally {
      setCreating(false)
    }
  }

  async function saveHeadcount() {
    if (!selectedSession) return
    setHeadcountSaving(true)
    setError(null)
    try {
      const payload: any = {}
      for (const k of Object.keys(headcount) as (keyof typeof headcount)[]) {
        const v = headcount[k]
        if (v !== '') payload[k] = Number(v)
      }

      const res = await fetch(`/api/attendance/sessions/${selectedSession.id}/headcount`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ headcount: payload }),
      })
      if (!res.ok) throw new Error(await readApiError(res))
      const json = await res.json()

      const updated = json.session
      setSelectedSession((prev) => (prev ? { ...prev, headcount: updated.headcount } : prev))
      await loadSessions()
    } catch (e: any) {
      setError(e?.message || 'Failed')
    } finally {
      setHeadcountSaving(false)
    }
  }

  async function checkIn() {
    if (!selectedSession) return
    setCheckInSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/attendance/sessions/${selectedSession.id}/check-in`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: checkInForm.userId || null,
          guestName: checkInForm.guestName || null,
          channel: checkInForm.channel,
        }),
      })
      if (!res.ok) throw new Error(await readApiError(res))
      setCheckInForm((p) => ({ ...p, userId: '', guestName: '' }))
      await loadRecords(selectedSession.id)
      await loadSessions()
    } catch (e: any) {
      setError(e?.message || 'Failed')
    } finally {
      setCheckInSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-gray-600 mt-1">Create sessions and track headcount + member check-ins.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <label className="text-xs font-semibold text-gray-600">Branch ID (optional)</label>
          <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={branchId} onChange={(e) => setBranchId(e.target.value)} />
        </div>
        <div className="bg-white rounded-xl border p-4">
          <label className="text-xs font-semibold text-gray-600">Start (optional)</label>
          <input type="date" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="bg-white rounded-xl border p-4">
          <label className="text-xs font-semibold text-gray-600">End (optional)</label>
          <input type="date" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="text-lg font-semibold">Create Session</h2>
          <div>
            <label className="text-xs font-semibold text-gray-600">Title</label>
            <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={createForm.title} onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">Type</label>
              <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={createForm.type} onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value }))}>
                <option value="SERVICE">SERVICE</option>
                <option value="MEETING">MEETING</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Mode</label>
              <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={createForm.mode} onChange={(e) => setCreateForm((p) => ({ ...p, mode: e.target.value }))}>
                <option value="OFFLINE">OFFLINE</option>
                <option value="ONLINE">ONLINE</option>
                <option value="HYBRID">HYBRID</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Start at</label>
            <input type="datetime-local" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={createForm.startAt} onChange={(e) => setCreateForm((p) => ({ ...p, startAt: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">Location (optional)</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={createForm.location} onChange={(e) => setCreateForm((p) => ({ ...p, location: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Notes (optional)</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={createForm.notes} onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <button disabled={creating} onClick={createSession} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm disabled:opacity-60">
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-lg font-semibold mb-3">Sessions</h2>
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-auto">
              {sessions.length === 0 ? (
                <div className="text-gray-600">No sessions for this filter.</div>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={async () => {
                      setSelectedSession(s)
                      setHeadcount({
                        total: s.headcount?.total?.toString?.() || '',
                        men: s.headcount?.men?.toString?.() || '',
                        women: s.headcount?.women?.toString?.() || '',
                        children: s.headcount?.children?.toString?.() || '',
                        firstTimers: s.headcount?.firstTimers?.toString?.() || '',
                      })
                      await loadRecords(s.id)
                    }}
                    className={`w-full text-left border rounded-lg p-3 hover:bg-gray-50 ${selectedSession?.id === s.id ? 'border-blue-400 bg-blue-50/30' : ''}`}
                  >
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="text-xs text-gray-600">{new Date(s.startAt).toLocaleString()} • {s.type} • {s.mode} {s.branchId ? `• Branch: ${s.branchId}` : ''}</div>
                    <div className="text-xs text-gray-600 mt-1">Check-ins: {s.checkInCount ?? 0}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {selectedSession && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="text-lg font-semibold">Headcount</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(['total','men','women','children','firstTimers'] as const).map((k) => (
                <div key={k}>
                  <label className="text-xs font-semibold text-gray-600">{k}</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={headcount[k]} onChange={(e) => setHeadcount((p) => ({ ...p, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
            <button disabled={headcountSaving} onClick={saveHeadcount} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm disabled:opacity-60">
              {headcountSaving ? 'Saving...' : 'Save Headcount'}
            </button>
          </div>

          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="text-lg font-semibold">Member / Guest Check-in</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">User ID (optional)</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={checkInForm.userId} onChange={(e) => setCheckInForm((p) => ({ ...p, userId: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Guest name (optional)</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={checkInForm.guestName} onChange={(e) => setCheckInForm((p) => ({ ...p, guestName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Channel</label>
                <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={checkInForm.channel} onChange={(e) => setCheckInForm((p) => ({ ...p, channel: e.target.value }))}>
                  <option value="OFFLINE">OFFLINE</option>
                  <option value="ONLINE">ONLINE</option>
                </select>
              </div>
            </div>
            <button disabled={checkInSaving} onClick={checkIn} className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm disabled:opacity-60">
              {checkInSaving ? 'Checking in...' : 'Check in'}
            </button>

            <div className="pt-3">
              <h3 className="text-sm font-semibold">Records</h3>
              <div className="space-y-2 max-h-[260px] overflow-auto mt-2">
                {records.length === 0 ? (
                  <div className="text-gray-600 text-sm">No records yet.</div>
                ) : (
                  records.map((r) => (
                    <div key={r.id} className="border rounded-lg p-3">
                      <div className="text-sm font-semibold">{r.userId ? `User: ${r.userId}` : `Guest: ${r.guestName || 'Unknown'}`}</div>
                      <div className="text-xs text-gray-600">{new Date(r.checkedInAt).toLocaleString()} • {r.channel}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
