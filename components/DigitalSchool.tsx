'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

type AccessType = 'open' | 'request' | 'invite'
type ProgressState = 'not-started' | 'in-progress' | 'completed'

type Course = {
  id: string
  title: string
  description: string
  access: AccessType
  modules: number
  hours: number
  mentors: string[]
  format: string[]
  status: ProgressState
  progress: number
  badgeColor: string
}

type EnrollmentQueueItem = {
  courseId: string
  moduleTitle: string
  due: string
  action: string
}

type AdminAction = {
  title: string
  status: string
  updatedBy: string
  timestamp: string
}

type AccessRequest = {
  id: string
  userLabel: string
  courseTitle: string
  reason: string
  status: string
}

type ProgressRow = {
  member: string
  course: string
  completion: number
  examScore: string
}

type ExamUpload = {
  title: string
  questions: number
  status: string
  owner: string
}

type CourseDraft = {
  title: string
  access: AccessType
  mentors: string
  moduleBrief: string
  estimatedHours: number
  format: string
}

const TODO_ITEMS = [
  {
    title: 'Course catalog UI',
    description: 'Display Foundation Class / School of Ministry tiles with access type + mentors.',
    status: 'Complete',
  },
  {
    title: 'Module layout',
    description: 'Group embedded videos + uploaded audio lessons inside sections.',
    status: 'Pending',
  },
  {
    title: 'CBT exam engine',
    description: 'Multiple-choice test UI with timers, parsing upload tool, and detailed results.',
    status: 'Pending',
  },
  {
    title: 'Admin workflows',
    description: 'Course creator, invite/request flows, exam/question uploads, result exports.',
    status: 'Pending',
  },
  {
    title: 'Leaderboard integration',
    description: 'Badge issuance after completion and visibility on member profiles.',
    status: 'Pending',
  },
]

const FEATURED_COURSES: Course[] = [
  {
    id: 'foundation',
    title: 'Foundation Class',
    description: 'Establish solid doctrine, grow devotional rhythms, and learn Ecclesia DNA.',
    access: 'open',
    modules: 8,
    hours: 12,
    mentors: ['Pastor Ada', 'Coach Ben'],
    format: ['Video lessons', 'Audio reflection', 'Weekly quizzes'],
    status: 'in-progress',
    progress: 45,
    badgeColor: 'bg-amber-500',
  },
  {
    id: 'ministry',
    title: 'School of Ministry',
    description: 'Leadership intensives for ordained ministers and ministry trainees.',
    access: 'request',
    modules: 12,
    hours: 20,
    mentors: ['Rev. Daniel'],
    format: ['Live cohorts', 'Embedded sermons', 'Capstone exam'],
    status: 'not-started',
    progress: 0,
    badgeColor: 'bg-indigo-500',
  },
  {
    id: 'marriage',
    title: 'Marriage Preparation Labs',
    description: 'Three-module journey for engaged couples with guided conversations.',
    access: 'invite',
    modules: 3,
    hours: 6,
    mentors: ['Couples Council'],
    format: ['Audio coaching', 'Couple worksheets', 'Certification quiz'],
    status: 'completed',
    progress: 100,
    badgeColor: 'bg-rose-500',
  },
]

const DEFAULT_ENROLLMENTS: EnrollmentQueueItem[] = [
  {
    courseId: 'foundation',
    moduleTitle: 'Module 3 · Spiritual Disciplines',
    due: 'Due in 2 days',
    action: 'Continue module',
  },
  {
    courseId: 'ministry',
    moduleTitle: 'Awaiting cohort approval',
    due: 'Pending admin review',
    action: 'Track request',
  },
]

const DEFAULT_ADMIN_ACTIONS: AdminAction[] = [
  {
    title: 'Foundation Class · Module Builder',
    status: 'Draft saved',
    updatedBy: 'Pastor Ada',
    timestamp: '10 mins ago',
  },
  {
    title: 'CBT Parser · Batch 002',
    status: 'Awaiting validation',
    updatedBy: 'QA Bot',
    timestamp: 'Today, 8:12am',
  },
]

const DEFAULT_ACCESS_REQUESTS: AccessRequest[] = [
  {
    id: 'local-ifeoma',
    userLabel: 'Ifeoma N.',
    courseTitle: 'School of Ministry',
    reason: 'Campus pastor track',
    status: 'Awaiting review',
  },
  {
    id: 'local-chuka-amaka',
    userLabel: 'Chuka & Amaka',
    courseTitle: 'Marriage Preparation Labs',
    reason: 'Wedding in Feb',
    status: 'Invite sent',
  },
]

const DEFAULT_PROGRESS_ROWS: ProgressRow[] = [
  { member: 'Joy Okafor', course: 'Foundation Class', completion: 78, examScore: 'Pending' },
  { member: 'Tolu Adebayo', course: 'Marriage Preparation Labs', completion: 100, examScore: '92%' },
  { member: 'David Onuoha', course: 'School of Ministry', completion: 33, examScore: '-' },
]

const DEFAULT_EXAM_UPLOADS: ExamUpload[] = [
  { title: 'Doctrine Quiz v1', questions: 25, status: 'Validated', owner: 'Coach Ben' },
  { title: 'Capstone CBT March', questions: 60, status: 'Needs review', owner: 'Rev. Daniel' },
]

export default function DigitalSchool() {
  const [courses, setCourses] = useState<Course[]>(FEATURED_COURSES)
  const [enrollments, setEnrollments] = useState<EnrollmentQueueItem[]>(DEFAULT_ENROLLMENTS)
  const [adminActions, setAdminActions] = useState<AdminAction[]>(DEFAULT_ADMIN_ACTIONS)
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(DEFAULT_ACCESS_REQUESTS)
  const [examUploads, setExamUploads] = useState<ExamUpload[]>(DEFAULT_EXAM_UPLOADS)
  const [progressRows, setProgressRows] = useState<ProgressRow[]>(DEFAULT_PROGRESS_ROWS)
  const [selectedProgress, setSelectedProgress] = useState<ProgressRow | null>(null)
  const [courseDraft, setCourseDraft] = useState<CourseDraft>({
    title: '',
    access: 'open',
    mentors: '',
    moduleBrief: '',
    estimatedHours: 6,
    format: 'Video lessons, Audio reflections',
  })
  const [draftModules, setDraftModules] = useState<string[]>(['Orientation'])
  const [draftMessage, setDraftMessage] = useState<string | null>(null)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const examUploadInputRef = useRef<HTMLInputElement | null>(null)

  const pendingItems = useMemo(
    () =>
      TODO_ITEMS.map((item, index) => ({
        ...item,
        label: `DS-0${index + 1}`,
      })),
    [],
  )

  const courseStats = useMemo(() => {
    const pendingInvites = accessRequests.filter((req) =>
      req.status.toLowerCase().includes('await') || req.status.toLowerCase().includes('pending'),
    ).length
    const badgesEarned = progressRows.filter((row) => row.completion >= 100).length
    return [
      { label: 'Active Courses', value: courses.length },
      { label: 'Invites Pending', value: pendingInvites },
      { label: 'Badges Earned', value: badgesEarned },
    ]
  }, [accessRequests, courses, progressRows])

  const actionLabel = (access: AccessType, status: ProgressState) => {
    if (status === 'completed') return 'View certificate'
    if (status === 'in-progress') return 'Continue course'
    if (access === 'open') return 'Enroll now'
    if (access === 'request') return 'Request access'
    return 'Accept invite'
  }

  const accessBadge = (access: AccessType) => {
    switch (access) {
      case 'open':
        return 'bg-emerald-100 text-emerald-700'
      case 'request':
        return 'bg-amber-100 text-amber-700'
      case 'invite':
      default:
        return 'bg-indigo-100 text-indigo-700'
    }
  }

  const handleDraftChange = (field: keyof CourseDraft, value: string | number | AccessType) => {
    setCourseDraft((prev) => ({
      ...prev,
      [field]: typeof value === 'string' ? value : Number(value),
    }))
  }

  const handleAddModule = () => {
    setDraftModules((prev) => [...prev, `Module ${prev.length + 1}`])
  }

  const handleRemoveModule = (module: string) => {
    setDraftModules((prev) => prev.filter((item) => item !== module))
  }

  const handleSaveDraft = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!courseDraft.title.trim()) {
      setDraftMessage('Course title is required before saving.')
      return
    }

    const mentors = courseDraft.mentors
      .split(',')
      .map((mentor) => mentor.trim())
      .filter(Boolean)
    const formatTags = courseDraft.format
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title: courseDraft.title.trim(),
      description: courseDraft.moduleBrief || 'New discipleship modules launching soon.',
      access: courseDraft.access,
      modules: draftModules.length,
      hours: Math.max(1, Math.round(courseDraft.estimatedHours)),
      mentors: mentors.length ? mentors : ['Training Team'],
      format: formatTags.length ? formatTags : ['Video lessons'],
      status: 'not-started',
      progress: 0,
      badgeColor:
        courseDraft.access === 'open'
          ? 'bg-emerald-500'
          : courseDraft.access === 'request'
            ? 'bg-amber-500'
            : 'bg-indigo-500',
    }

    setCourses((prev) => [newCourse, ...prev])
    setAdminActions((prev) => [
      {
        title: `${newCourse.title} · Module Builder`,
        status: `Draft saved (${draftModules.length} modules)`,
        updatedBy: 'You',
        timestamp: 'Just now',
      },
      ...prev,
    ])
    setDraftModules(['Orientation'])
    setCourseDraft({
      title: '',
      access: 'open',
      mentors: '',
      moduleBrief: '',
      estimatedHours: 6,
      format: 'Video lessons, Audio reflections',
    })
    setDraftMessage(`Saved "${newCourse.title}" draft – ready for module upload.`)
  }

  const handleEnrollAction = (courseId: string) => {
    const course = courses.find((item) => item.id === courseId)
    if (!course) return

    if (course.status === 'completed') {
      const row = progressRows.find((progress) => progress.course === course.title)
      if (row) setSelectedProgress(row)
      return
    }

    setEnrollments((prev) => {
      const existing = prev.find((item) => item.courseId === courseId)
      if (existing) {
        return prev.map((item) =>
          item.courseId === courseId
            ? {
                ...item,
                due: course.access === 'open' ? 'Orientation unlocked' : 'Awaiting approval',
                action: course.access === 'open' ? 'Resume today' : 'Track request',
              }
            : item,
        )
      }

      return [
        {
          courseId,
          moduleTitle: `Module 1 · ${course.title}`,
          due: course.access === 'open' ? 'Can start now' : 'Awaiting admin',
          action: course.access === 'open' ? 'Begin orientation' : 'Track request',
        },
        ...prev,
      ]
    })
  }

  const handleExamUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const estimatedQuestions = Math.max(10, Math.round(file.size / 1500))
    setExamUploads((prev) => [
      {
        title: file.name.replace(/\.[^/.]+$/, ''),
        questions: estimatedQuestions,
        status: 'Awaiting validation',
        owner: 'You',
      },
      ...prev,
    ])
    setUploadMessage(`Uploaded ${file.name} (${estimatedQuestions} questions detected).`)
    event.target.value = ''
  }

  const promoteExamUpload = (title: string) => {
    setExamUploads((prev) =>
      prev.map((upload) =>
        upload.title === title ? { ...upload, status: 'Validated' } : upload,
      ),
    )
  }

  const handleAccessDecision = (
    userLabel: string,
    decision: 'Approved' | 'Invite sent' | 'More info requested',
  ) => {
    setAccessRequests((prev) =>
      prev.map((request) =>
        request.userLabel === userLabel ? { ...request, status: decision } : request,
      ),
    )
  }

  const handleDownloadTemplate = () => {
    const csv =
      'question,optionA,optionB,optionC,optionD,correctOption,durationSeconds\n' +
      '"Who is the Holy Spirit?","Comforter","Friend","Guide","All of the above","D","60"\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'digital-school-cbt-template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleTimelineView = (row: ProgressRow) => {
    setSelectedProgress(row)
  }

  const handleProgressComplete = (member: string) => {
    setProgressRows((prev) =>
      prev.map((row) =>
        row.member === member
          ? { ...row, completion: 100, examScore: row.examScore === '-' ? 'Pending grading' : row.examScore }
          : row,
      ),
    )
    setSelectedProgress((prev) =>
      prev && prev.member === member
        ? { ...prev, completion: 100, examScore: prev.examScore === '-' ? 'Pending grading' : prev.examScore }
        : prev,
    )
  }

  const markExamScore = (member: string, score: string) => {
    setProgressRows((prev) =>
      prev.map((row) => (row.member === member ? { ...row, examScore: score } : row)),
    )
    setSelectedProgress((prev) => (prev && prev.member === member ? { ...prev, examScore: score } : prev))
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/70">Digital School</p>
            <h1 className="text-3xl font-semibold mt-2">Scaffolded Learning Management Hub</h1>
            <p className="text-white/85 mt-3 max-w-2xl">
              We&apos;re building a full discipleship academy with courses, embedded media, modular exams, and badges.
              This tab currently outlines the roadmap so we can deliver features incrementally.
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl px-6 py-4 text-center">
            <p className="text-sm uppercase tracking-wide text-white/80">Next build</p>
            <p className="text-3xl font-semibold">Course Catalog</p>
            <p className="text-xs text-white/70 mt-1">DS-01</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {courseStats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl shadow p-5 border border-gray-100">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{stat.label}</p>
            <p className="text-3xl font-semibold mt-2 text-gray-900">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-gray-100 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold">Course Catalog</h2>
            <p className="text-sm text-gray-500">Browse tracks curated by the training team.</p>
          </div>
          <button className="px-4 py-2 rounded-full border text-sm text-gray-600 hover:bg-gray-50">View syllabus</button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <div key={course.id} className="border rounded-3xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${accessBadge(course.access)}`}>
                  {course.access === 'open'
                    ? 'Open'
                    : course.access === 'request'
                      ? 'Request access'
                      : 'Invitation only'}
                </span>
                <span className="text-xs text-gray-400 uppercase tracking-wide">{course.modules} modules</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{course.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                {course.format.map((item) => (
                  <span key={item} className="bg-gray-100 px-2 py-1 rounded-full">
                    {item}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Mentors</p>
                  <p className="text-sm text-gray-800">{course.mentors.join(', ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Hours</p>
                  <p className="text-sm text-gray-800">{course.hours} hrs</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${course.badgeColor} h-2 rounded-full`}
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{course.status === 'completed' ? 'Completed' : `${course.progress}% progress`}</span>
                  {course.status === 'completed' && <span className="text-emerald-600 font-semibold">Badge issued</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700"
                  onClick={() => handleEnrollAction(course.id)}
                >
                  {actionLabel(course.access, course.status)}
                </button>
                <button className="px-4 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50">Details</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Implementation To-Do</h2>
            <p className="text-sm text-gray-500">Member-facing catalog is live; next sprint unlocks admin + exams.</p>
          </div>
          <Link href="/dashboard/superadmin" className="text-sm text-primary-600 underline">
            Manage permissions
          </Link>
        </div>

        <ol className="space-y-3">
          {pendingItems.map((item) => (
            <li key={item.label} className="border rounded-2xl p-4 flex flex-col gap-1 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</span>
                <span
                  className={`text-xs font-semibold ${
                    item.status === 'Complete' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">My learning queue</h2>
            <p className="text-sm text-gray-500">Next up in your discipleship journey.</p>
          </div>
          <Link href="/dashboard/profile" className="text-sm text-primary-600 underline">
            View badges
          </Link>
        </div>
        <div className="space-y-3">
          {enrollments.map((item) => {
            const course = courses.find((course) => course.id === item.courseId)
            return (
              <div
                key={item.courseId}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border rounded-2xl p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{course?.title}</p>
                  <p className="text-sm text-gray-600">{item.moduleTitle}</p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm">
                  <span className="text-amber-600 font-medium">{item.due}</span>
                  <button
                    className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                    onClick={() => handleEnrollAction(item.courseId)}
                  >
                    {item.action}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-100 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Admin cockpit</p>
              <h2 className="text-xl font-semibold">Course creation workflow</h2>
            </div>
            <button className="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-sm">Open builder</button>
          </div>

          <form className="space-y-4" onSubmit={handleSaveDraft}>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-gray-600 flex flex-col gap-1">
                Course title
                <input
                  type="text"
                  placeholder="Foundation Class"
                  value={courseDraft.title}
                  onChange={(event) => handleDraftChange('title', event.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </label>
              <label className="text-sm text-gray-600 flex flex-col gap-1">
                Access mode
                <select
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                  value={courseDraft.access}
                  onChange={(event) => handleDraftChange('access', event.target.value as AccessType)}
                >
                  <option value="open">Open</option>
                  <option value="request">Request</option>
                  <option value="invite">Invitation</option>
                </select>
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-gray-600 flex flex-col gap-1">
                Estimated hours
                <input
                  type="number"
                  min={1}
                  value={courseDraft.estimatedHours}
                  onChange={(event) => handleDraftChange('estimatedHours', Number(event.target.value))}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </label>
              <label className="text-sm text-gray-600 flex flex-col gap-1">
                Format tags (comma separated)
                <input
                  type="text"
                  value={courseDraft.format}
                  onChange={(event) => handleDraftChange('format', event.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </label>
            </div>
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Mentor roster
              <input
                type="text"
                placeholder="Ada, Ben, Daniel"
                value={courseDraft.mentors}
                onChange={(event) => handleDraftChange('mentors', event.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </label>
            <label className="text-sm text-gray-600 flex flex-col gap-1">
              Module brief
              <textarea
                placeholder="Outline each module with video/audio references..."
                value={courseDraft.moduleBrief}
                onChange={(event) => handleDraftChange('moduleBrief', event.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                rows={3}
              />
            </label>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-gray-400">Module checklist</p>
              <div className="flex flex-wrap gap-2">
                {draftModules.map((module) => (
                  <span key={module} className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-700 flex items-center gap-2">
                    {module}
                    {draftModules.length > 1 && (
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-700"
                        onClick={() => handleRemoveModule(module)}
                        aria-label={`Remove ${module}`}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={handleAddModule}
                  className="px-3 py-1 rounded-full border border-dashed text-xs text-gray-600 hover:bg-gray-50"
                >
                  + Add module
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700">
                Save draft
              </button>
              <button type="button" className="px-4 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50">
                Upload cover
              </button>
            </div>
            {draftMessage && <p className="text-sm text-emerald-600">{draftMessage}</p>}
          </form>

          <div className="space-y-3">
            {adminActions.map((action) => (
              <div key={action.title} className="border rounded-2xl p-4 flex flex-col gap-1 bg-gray-50">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{action.title}</span>
                  <span>{action.timestamp}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{action.status}</span>
                  <span className="text-gray-500">by {action.updatedBy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 border border-gray-100 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">CBT & access</p>
              <h2 className="text-xl font-semibold">Exam uploads + requests</h2>
            </div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50"
                onClick={handleDownloadTemplate}
                type="button"
              >
                Download template
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-primary-50 text-primary-700 text-sm"
                onClick={() => examUploadInputRef.current?.click()}
              >
                Upload CBT file
              </button>
            </div>
          </div>
          <input ref={examUploadInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleExamUpload} />
          {uploadMessage && <p className="text-xs text-emerald-600">{uploadMessage}</p>}

          <div className="space-y-3">
            {examUploads.map((upload) => (
              <div key={upload.title} className="border rounded-2xl p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-900">{upload.title}</span>
                  <span className="text-gray-500">{upload.questions} questions</span>
                </div>
                <div className="flex items-center justify-between text-xs gap-3">
                  <span
                    className={`px-3 py-1 rounded-full ${
                      upload.status === 'Validated' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {upload.status}
                  </span>
                  <span className="text-gray-500">Owner: {upload.owner}</span>
                  {upload.status !== 'Validated' && (
                    <button
                      type="button"
                      className="text-primary-600 font-semibold"
                      onClick={() => promoteExamUpload(upload.title)}
                    >
                      Validate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border rounded-2xl p-4 space-y-3 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Pending access requests</h3>
            {accessRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-1 border border-dashed border-gray-200 rounded-xl p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{request.userLabel}</span>
                  <span className="text-xs text-gray-500">{request.courseTitle}</span>
                </div>
                <p className="text-xs text-gray-600">{request.reason}</p>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs"
                    type="button"
                    onClick={() => handleAccessDecision(request.userLabel, 'Approved')}
                  >
                    Approve
                  </button>
                  <button
                    className="px-3 py-1 rounded-lg border text-xs text-gray-600"
                    type="button"
                    onClick={() => handleAccessDecision(request.userLabel, 'More info requested')}
                  >
                    Request info
                  </button>
                </div>
                <span className="text-[11px] uppercase tracking-wide text-gray-400">{request.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-gray-100 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold">User progress snapshots</h2>
            <p className="text-sm text-gray-500">Track completions, exams, and readiness for badges.</p>
          </div>
          <button className="px-4 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50">Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4 font-medium">Member</th>
                <th className="py-2 pr-4 font-medium">Course</th>
                <th className="py-2 pr-4 font-medium">Completion</th>
                <th className="py-2 pr-4 font-medium">Exam score</th>
                <th className="py-2 pr-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {progressRows.map((row) => (
                <tr key={row.member} className="border-b last:border-0">
                  <td className="py-3 pr-4 text-gray-900">{row.member}</td>
                  <td className="py-3 pr-4 text-gray-700">{row.course}</td>
                  <td className="py-3 pr-4 text-gray-700">{row.completion}%</td>
                  <td className="py-3 pr-4 text-gray-700">{row.examScore}</td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-3 text-xs">
                      {row.completion < 100 && (
                        <button className="text-emerald-600 font-semibold" onClick={() => handleProgressComplete(row.member)}>
                          Mark 100%
                        </button>
                      )}
                      <button className="text-primary-600 font-semibold" onClick={() => handleTimelineView(row)}>
                        View timeline
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedProgress && (
          <div className="border rounded-2xl p-5 bg-gray-50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{selectedProgress.member}</p>
                <p className="text-sm text-gray-600">{selectedProgress.course}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border text-xs text-gray-700"
                  onClick={() => markExamScore(selectedProgress.member, 'Submitted')}
                >
                  Mark exam submitted
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg bg-primary-600 text-white text-xs"
                  onClick={() => handleProgressComplete(selectedProgress.member)}
                >
                  Issue badge
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Completion: <span className="font-semibold text-gray-900">{selectedProgress.completion}%</span> · Exam score:{' '}
              <span className="font-semibold text-gray-900">{selectedProgress.examScore}</span>
            </p>
            <p className="text-xs text-gray-500">
              Timeline view shows module submissions, CBT attempts, and badge readiness for this learner. Hook this up to Firestore once
              collections are provisioned.
            </p>
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-dashed border-gray-200">
        <h2 className="text-xl font-semibold mb-2">Upcoming artifacts</h2>
        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
          <li>Course & module Firestore collections + access control fields.</li>
          <li>Exam/question parser spec (CSV / JSON) with validation.</li>
          <li>Result export endpoints and user-facing feedback pages.</li>
          <li>Badge sync with Leaderboard once course completion achieved.</li>
        </ul>
        <p className="text-sm text-gray-500 mt-4">
          Want to reprioritize items? Ping the team and we&apos;ll adjust the backlog before coding the next milestone.
        </p>
      </section>
    </div>
  )
}
