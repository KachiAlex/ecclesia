  'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface ReadingPlan {
  id: string
  title: string
  description?: string
  duration: number
  userProgress: {
    id: string
    currentDay: number
    completed: boolean
    startedAt: string
    completedAt?: string
  } | null
}

interface ReadingPlanResource {
  id: string
  title: string
  description?: string
  type: 'book' | 'pdf' | 'audio' | 'video' | 'link'
  fileUrl?: string
  fileName?: string
  contentType?: string
  size?: number
  createdAt: string
}

interface ReadingPlanDayResponse {
  id: string
  planId: string
  dayNumber: number
  title: string
  summary?: string
  devotionalText?: string
  prayerFocus?: string
  passage: {
    reference: string
    content: string
    copyright?: string
  }
  bibleVersion: {
    id: string
    name: string
    abbreviation: string
  }
  resources: ReadingPlanResource[]
}

interface ReadingCoachContextResult {
  context: {
    dailyVerse?: {
      reference: string
      theme: string
      excerpt?: string
    }
    progress?: {
      currentDay: number
      totalDays?: number
      percentComplete?: number
      completed?: boolean
    } | null
    day?: {
      dayNumber: number
      title?: string
      summary?: string
      prayerFocus?: string
    } | null
    passage?: {
      reference?: string
      excerpt?: string
    } | null
  }
  plan?: {
    id: string
    title: string
    duration: number
    topics?: string[]
  } | null
  progress?: {
    id: string
    currentDay: number
    completed: boolean
    percentComplete?: number
  } | null
  day?: {
    dayNumber: number
    title?: string
    summary?: string
    prayerFocus?: string
  } | null
  dayResources?: {
    id: string
    title: string
    type?: string
    description?: string
  }[]
  dailyVerse?: {
    reference: string
    theme: string
    excerpt?: string
  }
}

interface ReadingCoachSession {
  id: string
  question: string
  answer: string
  actionStep?: string
  encouragement?: string
  scriptures?: string[]
  followUpQuestion?: string
  metadata?: {
    insights?: string[]
  }
  createdAt: string
}

interface ReadingCoachNudge {
  id: string
  type: 'progress' | 'reminder' | 'celebration' | 'insight'
  message: string
  createdAt: string
  metadata?: Record<string, any>
}

const MANAGER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'PASTOR']

export default function ReadingPlanDetail({ planId }: { planId: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [plan, setPlan] = useState<ReadingPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [selectedDay, setSelectedDay] = useState(1)
  const [dayData, setDayData] = useState<ReadingPlanDayResponse | null>(null)
  const [dayLoading, setDayLoading] = useState(false)
  const [dayError, setDayError] = useState<string | null>(null)
  const [resources, setResources] = useState<ReadingPlanResource[]>([])
  const [resourcesLoading, setResourcesLoading] = useState(true)
  const [resourceFile, setResourceFile] = useState<File | null>(null)
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceDescription, setResourceDescription] = useState('')
  const [resourceType, setResourceType] = useState<'book' | 'pdf' | 'audio' | 'video' | 'link'>('book')
  const [resourceUploading, setResourceUploading] = useState(false)
  const [coachContext, setCoachContext] = useState<ReadingCoachContextResult | null>(null)
  const [coachSessions, setCoachSessions] = useState<ReadingCoachSession[]>([])
  const [coachNudges, setCoachNudges] = useState<ReadingCoachNudge[]>([])
  const [coachLoading, setCoachLoading] = useState(true)
  const [coachQuestion, setCoachQuestion] = useState('')
  const [coachSubmitting, setCoachSubmitting] = useState(false)

  const canManage = MANAGER_ROLES.includes(((session?.user as any)?.role as string) || '')

  const loadPlan = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reading-plans/${planId}`)
      if (response.ok) {
        const data = await response.json()
        setPlan(data)
      } else {
        console.error('Failed to load reading plan')
      }
    } catch (error) {
      console.error('Error loading reading plan:', error)
    } finally {
      setLoading(false)
    }
  }, [planId])

  const loadDayContent = useCallback(
    async (dayNumber: number) => {
      if (!plan?.id) return
      setDayLoading(true)
      setDayError(null)
      try {
        const response = await fetch(`/api/reading-plans/${plan.id}/day/${dayNumber}`)
        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.error || 'Unable to load day content')
        }
        const data = await response.json()
        setDayData(data)
      } catch (error: any) {
        console.error('Error loading day content:', error)
        setDayData(null)
        setDayError(error.message || 'Unable to load this day yet.')
      } finally {
        setDayLoading(false)
      }
    },
    [plan?.id],
  )

  const loadResources = useCallback(async () => {
    if (!plan?.id) return
    setResourcesLoading(true)
    try {
      const response = await fetch(`/api/reading-plans/${plan.id}/resources`)
      if (response.ok) {
        const data = await response.json()
        setResources(data.resources || [])
      }
    } catch (error) {
      console.error('Error loading plan resources:', error)
    } finally {
      setResourcesLoading(false)
    }
  }, [plan?.id])

  const loadCoachContext = useCallback(async () => {
    if (!plan?.id) return
    try {
      setCoachLoading(true)
      const params = new URLSearchParams()
      params.set('planId', plan.id)
      params.set('dayNumber', selectedDay.toString())
      const response = await fetch(`/api/reading-coach/context?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCoachContext(data.context)
        setCoachSessions(data.recentSessions || [])
        setCoachNudges(data.pendingNudges || [])
      }
    } catch (error) {
      console.error('Error loading coach context:', error)
    } finally {
      setCoachLoading(false)
    }
  }, [plan?.id, selectedDay])

  const handleCoachAsk = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      if (!coachQuestion.trim() || coachSubmitting) return
      try {
        setCoachSubmitting(true)
        const response = await fetch('/api/reading-coach/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: coachQuestion.trim(),
            planId: plan?.id,
            dayNumber: selectedDay,
          }),
        })
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || 'Unable to get coach response.')
        }
        const data = await response.json()
        setCoachSessions((prev) => [
          {
            id: data.sessionId,
            question: data.question,
            answer: data.answer,
            actionStep: data.actionStep,
            encouragement: data.encouragement,
            scriptures: data.scriptures,
            followUpQuestion: data.followUpQuestion,
            metadata: { insights: data.insights },
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ])
        setCoachQuestion('')
      } catch (error: any) {
        alert(error.message || 'Failed to get coach insight.')
      } finally {
        setCoachSubmitting(false)
      }
    },
    [coachQuestion, coachSubmitting, plan?.id, selectedDay],
  )

  useEffect(() => {
    loadPlan()
  }, [loadPlan])

  const userProgressDay = plan?.userProgress?.currentDay

  useEffect(() => {
    if (typeof userProgressDay === 'number') {
      setSelectedDay(userProgressDay)
    }
  }, [userProgressDay])

  useEffect(() => {
    loadDayContent(selectedDay)
  }, [selectedDay, loadDayContent])

  useEffect(() => {
    loadResources()
    loadCoachContext()
  }, [loadResources, loadCoachContext])

  const updateProgress = async (day: number, completed?: boolean) => {
    if (!plan?.userProgress) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/reading-plans/progress/${plan.userProgress.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentDay: day,
          completed: completed !== undefined ? completed : day >= plan.duration,
        }),
      })

      if (response.ok) {
        await loadPlan() // Reload to get updated progress
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update progress')
      }
    } catch (error) {
      console.error('Error updating progress:', error)
      alert('Failed to update progress')
    } finally {
      setUpdating(false)
    }
  }

  const handleResourceUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!plan || !resourceFile) {
      alert('Select a book or resource file to upload.')
      return
    }

    setResourceUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', resourceFile)
      formData.append('planId', plan.id)
      if (resourceTitle) formData.append('title', resourceTitle)
      if (resourceDescription) formData.append('description', resourceDescription)
      formData.append('type', resourceType)

      const response = await fetch('/api/reading-plans/resources/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to upload resource')
      }

      setResourceTitle('')
      setResourceDescription('')
      setResourceFile(null)
      await loadResources()
      alert('Resource uploaded successfully.')
    } catch (error: any) {
      console.error('Error uploading resource:', error)
      alert(error.message || 'Failed to upload resource')
    } finally {
      setResourceUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading reading plan...</div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Reading plan not found</div>
        <Link href="/dashboard/reading-plans" className="mt-4 inline-block text-primary-600 hover:underline">
          ← Back to Reading Plans
        </Link>
      </div>
    )
  }

  const progress = plan.userProgress
  const progressPercent = progress ? (progress.currentDay / plan.duration) * 100 : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/reading-plans"
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Reading Plans
        </Link>
        <h1 className="text-3xl font-bold mb-2">{plan.title}</h1>
        {plan.description && (
          <p className="text-gray-600 mb-4">{plan.description}</p>
        )}
      </div>

      {/* Reading Coach */}
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="lg:w-1/2 space-y-4">
            <div>
              <h2 className="text-xl font-semibold">AI Reading Coach</h2>
              <p className="text-sm text-gray-500">
                Ask for insights, summaries, or encouragement about today&apos;s passage.
              </p>
            </div>
            <form onSubmit={handleCoachAsk} className="space-y-3">
              <textarea
                className="w-full border rounded-lg p-3 text-sm"
                rows={3}
                placeholder="Ask a question about today's passage..."
                value={coachQuestion}
                onChange={(e) => setCoachQuestion(e.target.value)}
              />
              <button
                type="submit"
                disabled={coachSubmitting || !coachQuestion.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {coachSubmitting ? 'Thinking...' : 'Ask the Coach'}
              </button>
            </form>
            <div className="space-y-2 text-sm text-gray-600">
              {coachLoading ? (
                <p>Loading insights...</p>
              ) : coachContext?.context?.dailyVerse ? (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-indigo-700 font-semibold">
                    Daily Theme • {coachContext.context.dailyVerse.theme}
                  </p>
                  <p className="font-medium mt-1">
                    {coachContext.context.dailyVerse.reference}
                  </p>
                  <p className="text-sm text-indigo-900 mt-1">
                    {coachContext.context.dailyVerse.excerpt}
                  </p>
                </div>
              ) : null}
              {!!coachNudges.length && (
                <div className="space-y-2">
                  {coachNudges.slice(0, 2).map((nudge) => (
                    <div
                      key={nudge.id}
                      className="border rounded-lg p-3 bg-amber-50 border-amber-200 text-amber-900 text-sm"
                    >
                      {nudge.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="lg:w-1/2 space-y-3 max-h-[360px] overflow-y-auto pr-2">
            <h3 className="text-lg font-semibold">Recent Insights</h3>
            {coachSessions.length === 0 ? (
              <p className="text-sm text-gray-500">Ask your first question to see AI guidance here.</p>
            ) : (
              coachSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold text-primary-700">You asked:</p>
                  <p className="text-sm text-gray-800">{session.question}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-1">Coach answered:</p>
                  <p className="text-sm text-gray-900 whitespace-pre-line">{session.answer}</p>
                  {session.actionStep && (
                    <p className="text-sm text-green-700">
                      <span className="font-semibold">Action Step:</span> {session.actionStep}
                    </p>
                  )}
                  {session.encouragement && (
                    <p className="text-sm text-amber-700 italic">{session.encouragement}</p>
                  )}
                  {session.metadata?.insights?.length && (
                    <ul className="text-sm text-gray-600 list-disc pl-5">
                      {session.metadata.insights.map((insight, idx) => (
                        <li key={idx}>{insight}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Progress Section */}
      {progress ? (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Progress</h2>
            {progress.completed && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ✓ Completed
              </span>
            )}
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Day {progress.currentDay} of {plan.duration}</span>
              <span>{Math.round(progressPercent)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary-600 h-3 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {progress.completed && progress.completedAt && (
            <p className="text-sm text-gray-600">
              Completed on {new Date(progress.completedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-center">
          <p className="text-gray-600 mb-4">You haven&apos;t started this reading plan yet.</p>
          <button
            onClick={async () => {
              try {
                const response = await fetch(`/api/reading-plans/${planId}/start`, {
                  method: 'POST',
                })
                if (response.ok) {
                  await loadPlan()
                } else {
                  const errorData = await response.json()
                  alert(errorData.error || 'Failed to start plan')
                }
              } catch (error) {
                console.error('Error starting plan:', error)
                alert('Failed to start plan')
              }
            }}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Start Reading Plan
          </button>
        </div>
      )}

      {/* Daily Reading Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Daily Scripture & Devotional</h2>
            <p className="text-gray-500 text-sm">
              Day {selectedDay} of {plan.duration}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDay((prev) => Math.max(1, prev - 1))}
              disabled={selectedDay <= 1}
              className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setSelectedDay((prev) => Math.min(plan.duration, prev + 1))}
              disabled={selectedDay >= plan.duration}
              className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
        <div className="mt-4">
          {dayLoading ? (
            <p className="text-gray-500">Loading day content...</p>
          ) : dayError ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
              {dayError}
            </div>
          ) : dayData ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-primary-600 font-semibold">
                  {dayData.bibleVersion.abbreviation} • {dayData.passage.reference}
                </p>
                <h3 className="text-2xl font-semibold mt-1">{dayData.title}</h3>
                {dayData.summary && <p className="text-gray-600 mt-1">{dayData.summary}</p>}
              </div>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: dayData.passage.content }}
              />
              {dayData.devotionalText && (
                <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                  <h4 className="font-semibold text-primary-800 mb-2">Devotional</h4>
                  <p className="text-primary-900 whitespace-pre-line">{dayData.devotionalText}</p>
                </div>
              )}
              {dayData.prayerFocus && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <h4 className="font-semibold text-amber-800 mb-2">Prayer Focus</h4>
                  <p className="text-amber-900 whitespace-pre-line">{dayData.prayerFocus}</p>
                </div>
              )}
              {dayData.resources?.length ? (
                <div>
                  <h4 className="font-semibold mb-2">Resources for this day</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {dayData.resources.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border rounded-lg p-3 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">{resource.title}</p>
                          {resource.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{resource.description}</p>
                          )}
                        </div>
                        <span className="text-xs uppercase tracking-wide text-gray-500">{resource.type}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-gray-500">This day has not been configured yet.</p>
          )}
        </div>
      </div>

      {/* Progress actions */}
      {progress && !progress.completed && (
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Mark Today&apos;s Reading</h2>
          <p className="text-sm text-gray-600 mb-4">
            Track your journey and move forward as you complete each day&apos;s reading.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => updateProgress(progress.currentDay + 1)}
              disabled={updating || progress.currentDay >= plan.duration}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Updating...' : 'Mark Day Complete'}
            </button>
            {progress.currentDay > 1 && (
              <button
                onClick={() => updateProgress(progress.currentDay - 1)}
                disabled={updating}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Go Back One Day
              </button>
            )}
          </div>
        </div>
      )}

      {/* Resources */}
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Plan Library</h2>
            <p className="text-gray-500 text-sm">Download devotion guides, books, and study helps.</p>
          </div>
          {canManage && (
            <form className="flex flex-col lg:flex-row gap-3 items-start lg:items-end" onSubmit={handleResourceUpload}>
              <div>
                <label className="text-xs uppercase text-gray-500">Book Title</label>
                <input
                  type="text"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-52"
                  placeholder="Title"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-gray-500">Description</label>
                <input
                  type="text"
                  value={resourceDescription}
                  onChange={(e) => setResourceDescription(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-64"
                  placeholder="Optional summary"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-gray-500">Type</label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value as any)}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="book">Book/PDF</option>
                  <option value="pdf">PDF</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                  <option value="link">Link</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase text-gray-500">Upload</label>
                <input
                  type="file"
                  onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                  className="block text-sm"
                  accept=".pdf,.epub,.doc,.docx,.ppt,.pptx"
                />
              </div>
              <button
                type="submit"
                disabled={resourceUploading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {resourceUploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          )}
        </div>
        {resourcesLoading ? (
          <p className="text-gray-500">Loading resources...</p>
        ) : resources.length === 0 ? (
          <p className="text-gray-500">No resources have been added yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border rounded-lg p-4 hover:bg-gray-50 flex justify-between items-start"
              >
                <div>
                  <p className="font-semibold">{resource.title}</p>
                  {resource.description && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{resource.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Uploaded {new Date(resource.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-wide text-gray-500">{resource.type}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Plan Info */}
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Plan Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Duration:</span>
            <span className="ml-2 font-medium">{plan.duration} days</span>
          </div>
          {progress && (
            <>
              <div>
                <span className="text-gray-600">Started:</span>
                <span className="ml-2 font-medium">
                  {new Date(progress.startedAt).toLocaleDateString()}
                </span>
              </div>
              {progress.completedAt && (
                <div>
                  <span className="text-gray-600">Completed:</span>
                  <span className="ml-2 font-medium">
                    {new Date(progress.completedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

