'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'

type AccessType = 'open' | 'request' | 'invite'
type ProgressState = 'not-started' | 'in-progress' | 'completed'

type CoursePricing =
  | { type: 'free' }
  | { type: 'paid'; amount: number; currency?: string }

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
  pricing?: CoursePricing
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

type ModuleDraft = {
  id: string
  title: string
  description: string
  estimatedMinutes: number
  videoUrl: string
  audioUrl: string
  audioFileName?: string
  bookFileName?: string
}

type SectionExamDraft = {
  title: string
  description: string
  timeLimitMinutes: number
  questionCount: number
  status: 'draft' | 'ready' | 'published'
  uploadPlaceholder?: string
}

type SectionDraft = {
  id: string
  title: string
  description: string
  modules: ModuleDraft[]
  exam: SectionExamDraft
}

type CourseDraft = {
  title: string
  access: AccessType
  mentors: string
  moduleBrief: string
  estimatedHours: number
  format: string
  pricing: CoursePricing
  sections: SectionDraft[]
}

const createModuleDraft = (): ModuleDraft => ({
  id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `module-${Date.now()}-${Math.random()}`,
  title: '',
  description: '',
  estimatedMinutes: 30,
  videoUrl: '',
  audioUrl: '',
  audioFileName: undefined,
  bookFileName: undefined,
})

const createExamDraft = (): SectionExamDraft => ({
  title: '',
  description: '',
  timeLimitMinutes: 30,
  questionCount: 20,
  status: 'draft',
  uploadPlaceholder: '',
})

const createSectionDraft = (): SectionDraft => ({
  id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `section-${Date.now()}-${Math.random()}`,
  title: '',
  description: '',
  modules: [createModuleDraft()],
  exam: createExamDraft(),
})

const createCourseDraft = (): CourseDraft => ({
  title: '',
  access: 'open',
  mentors: '',
  moduleBrief: '',
  estimatedHours: 6,
  format: 'Video lessons, Audio reflections',
  pricing: { type: 'free' },
  sections: [createSectionDraft()],
})

const formatPricingLabel = (pricing?: CoursePricing) => {
  if (!pricing || pricing.type === 'free') return 'Free access'
  const amount = typeof pricing.amount === 'number' ? pricing.amount : 0
  const formatted = amount.toLocaleString()
  const currency = pricing.currency ?? 'NGN'
  return `${currency} ${formatted}`
}

const badgeColorForAccess = (access: AccessType) => {
  switch (access) {
    case 'open':
      return 'bg-emerald-500'
    case 'request':
      return 'bg-amber-500'
    default:
      return 'bg-indigo-500'
  }
}

type ApiCourseResponse = {
  id: string
  title: string
  summary?: string
  accessType?: AccessType
  mentors?: string[]
  estimatedHours?: number
  tags?: string[]
  status?: 'draft' | 'published' | 'archived'
  pricing?: CoursePricing
  moduleCount?: number
  modules?: number
  progressPercent?: number
}

const mapApiCourseToUi = (apiCourse: ApiCourseResponse): Course => {
  const access = apiCourse.accessType ?? 'open'
  const format = apiCourse.tags && apiCourse.tags.length ? apiCourse.tags : ['Video lessons']
  const mentors = apiCourse.mentors && apiCourse.mentors.length ? apiCourse.mentors : ['Training Team']
  const status: ProgressState =
    apiCourse.status === 'published' ? 'in-progress' : apiCourse.status === 'archived' ? 'completed' : 'not-started'
  const progress =
    status === 'completed' ? 100 : status === 'in-progress' ? apiCourse.progressPercent ?? 20 : 0

  return {
    id: apiCourse.id,
    title: apiCourse.title,
    description: apiCourse.summary || 'New discipleship modules launching soon.',
    access,
    modules: typeof apiCourse.moduleCount === 'number' ? apiCourse.moduleCount : apiCourse.modules ?? 0,
    hours: apiCourse.estimatedHours ?? 1,
    mentors,
    format,
    status,
    progress,
    badgeColor: badgeColorForAccess(access),
    pricing: apiCourse.pricing ?? { type: 'free' },
  }
}

type ApiSectionResponse = {
  id: string
  courseId: string
  title: string
  description?: string
  order: number
}

type ApiModuleResponse = {
  id: string
  sectionId: string
  title: string
}

type ApiExamResponse = {
  id: string
  sectionId: string
  title: string
  status: string
}

async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
  })

  let data: any = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error((data && data.error) || 'Request failed')
  }

  return data as T
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
    pricing: { type: 'free' },
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
    pricing: { type: 'paid', amount: 50000, currency: 'NGN' },
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
    pricing: { type: 'free' },
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
  const [courseDraft, setCourseDraft] = useState<CourseDraft>(createCourseDraft())
  const [draftMessage, setDraftMessage] = useState<string | null>(null)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [reminderMessages, setReminderMessages] = useState<Record<string, string>>({})
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const examUploadInputRef = useRef<HTMLInputElement | null>(null)
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({})

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

  const loadCourses = useCallback(async () => {
    setIsLoadingCourses(true)
    try {
      const apiCourses = await requestJson<ApiCourseResponse[]>('/api/digital-school/courses')
      if (Array.isArray(apiCourses) && apiCourses.length) {
        setCourses(apiCourses.map(mapApiCourseToUi))
      }
    } catch (error) {
      console.error('DigitalSchool.loadCourses', error)
    } finally {
      setIsLoadingCourses(false)
    }
  }, [])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

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

  const handleDraftChange = (field: keyof CourseDraft, value: string | number | AccessType | CoursePricing) => {
    setCourseDraft((prev) => ({
      ...prev,
      [field]:
        field === 'pricing'
          ? (value as CoursePricing)
          : typeof value === 'string'
            ? value
            : Number(value),
    }))
  }

  const updateSections = (updater: (sections: SectionDraft[]) => SectionDraft[]) => {
    setCourseDraft((prev) => ({
      ...prev,
      sections: updater(prev.sections),
    }))
  }

  const handleAddSection = () => {
    updateSections((sections) => [...sections, createSectionDraft()])
  }

  const handleRemoveSection = (sectionId: string) => {
    updateSections((sections) => (sections.length > 1 ? sections.filter((section) => section.id !== sectionId) : sections))
  }

  const handleSectionChange = (sectionId: string, field: 'title' | 'description', value: string) => {
    updateSections((sections) =>
      sections.map((section) => (section.id === sectionId ? { ...section, [field]: value } : section)),
    )
  }

  const handleAddModule = (sectionId: string) => {
    updateSections((sections) =>
      sections.map((section) =>
        section.id === sectionId ? { ...section, modules: [...section.modules, createModuleDraft()] } : section,
      ),
    )
  }

  const handleRemoveModule = (sectionId: string, moduleId: string) => {
    updateSections((sections) =>
      sections.map((section) =>
        section.id === sectionId && section.modules.length > 1
          ? { ...section, modules: section.modules.filter((module) => module.id !== moduleId) }
          : section,
      ),
    )
  }

  const handleModuleChange = (
    sectionId: string,
    moduleId: string,
    field: keyof Pick<ModuleDraft, 'title' | 'description' | 'videoUrl' | 'audioUrl' | 'estimatedMinutes'>,
    value: string,
  ) => {
    updateSections((sections) =>
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              modules: section.modules.map((module) =>
                module.id === moduleId
                  ? {
                      ...module,
                      [field]: field === 'estimatedMinutes' ? Math.max(5, Number(value) || 0) : value,
                    }
                  : module,
              ),
            }
          : section,
      ),
    )
  }

  const handleModuleFileChange = (sectionId: string, moduleId: string, type: 'audio' | 'book', file: File | null) => {
    if (!file) return
    updateSections((sections) =>
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              modules: section.modules.map((module) =>
                module.id === moduleId
                  ? {
                      ...module,
                      audioFileName: type === 'audio' ? file.name : module.audioFileName,
                      bookFileName: type === 'book' ? file.name : module.bookFileName,
                    }
                  : module,
              ),
            }
          : section,
      ),
    )
  }

  const handleExamChange = (sectionId: string, field: keyof SectionExamDraft, value: string | number) => {
    const resolvedValue =
      field === 'timeLimitMinutes' || field === 'questionCount' ? Math.max(1, Number(value) || 0) : value

    updateSections((sections) =>
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              exam: {
                ...section.exam,
                [field]: resolvedValue,
              },
            }
          : section,
      ),
    )
  }

  const handleExamFileChange = (sectionId: string, file: File | null) => {
    if (!file) return
    updateSections((sections) =>
      sections.map((section) =>
        section.id === sectionId ? { ...section, exam: { ...section.exam, uploadPlaceholder: file.name } } : section,
      ),
    )
  }

  const registerFileInput = (key: string) => (element: HTMLInputElement | null) => {
    if (!element) {
      delete fileInputsRef.current[key]
      return
    }
    fileInputsRef.current[key] = element
  }

  const triggerFilePicker = (key: string) => {
    fileInputsRef.current[key]?.click()
  }

  const handleModuleFileInput =
    (sectionId: string, moduleId: string, type: 'audio' | 'book') => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null
      handleModuleFileChange(sectionId, moduleId, type, file)
      event.target.value = ''
    }

  const handleExamFileInput = (sectionId: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    handleExamFileChange(sectionId, file)
    event.target.value = ''
  }

  const handleSendReminder = (courseId: string) => {
    const course = courses.find((item) => item.id === courseId)
    const courseTitle = course?.title ?? 'this course'
    setReminderMessages((prev) => ({
      ...prev,
      [courseId]: `Reminder scheduled — we’ll nudge you to resume ${courseTitle}.`,
    }))
  }

  const handleSaveDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSavingDraft) return

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

    const moduleCount = courseDraft.sections.reduce((total, section) => total + section.modules.length, 0)
    const headers = {
      'Content-Type': 'application/json',
    }

    setIsSavingDraft(true)
    setDraftMessage(null)

    try {
      const createdCourse = await requestJson<ApiCourseResponse>('/api/digital-school/courses', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: courseDraft.title.trim(),
          summary: courseDraft.moduleBrief || 'New discipleship modules launching soon.',
          accessType: courseDraft.access,
          mentors,
          estimatedHours: Math.max(1, Math.round(courseDraft.estimatedHours)),
          tags: formatTags,
          status: 'draft',
          pricing: courseDraft.pricing,
        }),
      })

      const courseId = createdCourse.id

      for (const [sectionIndex, section] of courseDraft.sections.entries()) {
        const sectionMinutes = section.modules.reduce((total, module) => total + module.estimatedMinutes, 0)
        const sectionHours = Math.max(1, Math.round(sectionMinutes / 60) || 1)

        const createdSection = await requestJson<ApiSectionResponse>('/api/digital-school/sections', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            courseId,
            title: section.title.trim() || `Section ${sectionIndex + 1}`,
            description: section.description,
            order: sectionIndex + 1,
            estimatedHours: sectionHours,
          }),
        })

        for (const [moduleIndex, module] of section.modules.entries()) {
          await requestJson<ApiModuleResponse>('/api/digital-school/modules', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              courseId,
              sectionId: createdSection.id,
              title: module.title.trim() || `Module ${moduleIndex + 1}`,
              description: module.description,
              order: moduleIndex + 1,
              estimatedMinutes: module.estimatedMinutes,
            }),
          })
        }

        await requestJson<ApiExamResponse>('/api/digital-school/exams', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            courseId,
            sectionId: createdSection.id,
            title: section.exam.title.trim() || `${section.title || `Section ${sectionIndex + 1}`} exam`,
            description: section.exam.description,
            timeLimitMinutes: section.exam.timeLimitMinutes,
            status: section.exam.status,
            uploadMetadata: section.exam.uploadPlaceholder
              ? { source: 'admin-upload', originalFileName: section.exam.uploadPlaceholder }
              : undefined,
          }),
        })
      }

      await loadCourses()

      setAdminActions((prev) => [
        {
          title: `${createdCourse.title} · Module Builder`,
          status: `Draft saved (${courseDraft.sections.length} sections · ${moduleCount} modules)`,
          updatedBy: 'You',
          timestamp: 'Just now',
        },
        ...prev,
      ])

      setCourseDraft(createCourseDraft())
      fileInputsRef.current = {}
      setDraftMessage(`Saved "${createdCourse.title}" draft – ready for scheduled reminders and exams.`)
    } catch (error) {
      console.error('DigitalSchool.handleSaveDraft', error)
      setDraftMessage(
        error instanceof Error ? `Unable to save draft: ${error.message}` : 'Unable to save draft right now.',
      )
    } finally {
      setIsSavingDraft(false)
    }
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

  const handleExamUpload = (event: ChangeEvent<HTMLInputElement>) => {
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
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-full border text-sm text-gray-600 hover:bg-gray-50">View syllabus</button>
            <button
              className="px-4 py-2 rounded-full border border-primary-200 text-sm text-primary-700 hover:bg-primary-50 disabled:opacity-60"
              type="button"
              disabled={isLoadingCourses}
              onClick={loadCourses}
            >
              {isLoadingCourses ? 'Refreshing…' : 'Refresh catalog'}
            </button>
          </div>
        </div>

        {isLoadingCourses ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="border rounded-3xl p-5 flex flex-col gap-4 shadow-sm animate-pulse bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span className="h-6 w-20 rounded-full bg-gray-200" />
                  <span className="h-4 w-16 rounded bg-gray-200" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-3/4 rounded bg-gray-200" />
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-4 w-5/6 rounded bg-gray-200" />
                </div>
                <div className="flex gap-2">
                  <span className="h-6 w-16 rounded-full bg-gray-200" />
                  <span className="h-6 w-20 rounded-full bg-gray-200" />
                </div>
                <div className="h-2 w-full rounded bg-gray-200" />
                <div className="flex gap-2">
                  <span className="h-9 flex-1 rounded-lg bg-gray-200" />
                  <span className="h-9 w-20 rounded-lg bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Format</p>
                  <p className="text-sm text-gray-800">{course.format.join(', ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Pricing</p>
                  <p className="text-sm font-semibold text-gray-900">{formatPricingLabel(course.pricing)}</p>
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
        )}
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
                  {course && (
                    <div className="mt-2 space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full bg-primary-500" style={{ width: `${course.progress}%` }}></div>
                      </div>
                      <p className="text-xs text-gray-500">{course.progress}% complete · pass section exams to unlock the next modules.</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm">
                  <span className="text-amber-600 font-medium">{item.due}</span>
                  <button
                    className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                    onClick={() => handleEnrollAction(item.courseId)}
                  >
                    {item.action}
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg border text-primary-700 hover:bg-primary-50"
                    type="button"
                    onClick={() => handleSendReminder(item.courseId)}
                  >
                    Send reminder
                  </button>
                </div>
                {reminderMessages[item.courseId] && (
                  <p className="text-xs text-emerald-600">{reminderMessages[item.courseId]}</p>
                )}
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-gray-400">Sections, modules & exams</p>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary-600"
                  onClick={handleAddSection}
                >
                  + Add section
                </button>
              </div>

              <div className="space-y-4">
                {courseDraft.sections.map((section, sectionIndex) => (
                  <div key={section.id} className="border rounded-2xl p-4 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">Section {sectionIndex + 1}</p>
                        <p className="text-sm text-gray-500">Every section ends with an exam that must be passed to unlock the next stage.</p>
                      </div>
                      {courseDraft.sections.length > 1 && (
                        <button
                          type="button"
                          className="text-sm text-gray-500 hover:text-gray-800"
                          onClick={() => handleRemoveSection(section.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="text-sm text-gray-600 flex flex-col gap-1">
                        Section title
                        <input
                          type="text"
                          value={section.title}
                          onChange={(event) => handleSectionChange(section.id, 'title', event.target.value)}
                          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                          placeholder="Orientation & Ecclesia story"
                        />
                      </label>
                      <label className="text-sm text-gray-600 flex flex-col gap-1">
                        Section description
                        <input
                          type="text"
                          value={section.description}
                          onChange={(event) => handleSectionChange(section.id, 'description', event.target.value)}
                          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                          placeholder="Video walkthrough + discussion prompts"
                        />
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wide text-gray-400">Modules in this section</p>
                        <button
                          type="button"
                          className="text-xs font-semibold text-primary-600"
                          onClick={() => handleAddModule(section.id)}
                        >
                          + Add module
                        </button>
                      </div>

                      <div className="space-y-3">
                        {section.modules.map((module, moduleIndex) => (
                          <div key={module.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-gray-800">Module {moduleIndex + 1}</p>
                              {section.modules.length > 1 && (
                                <button
                                  type="button"
                                  className="text-xs text-gray-500 hover:text-gray-800"
                                  onClick={() => handleRemoveModule(section.id, module.id)}
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <label className="text-sm text-gray-600 flex flex-col gap-1">
                                Module title
                                <input
                                  type="text"
                                  value={module.title}
                                  onChange={(event) => handleModuleChange(section.id, module.id, 'title', event.target.value)}
                                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                                  placeholder="Welcome to Ecclesia"
                                />
                              </label>
                              <label className="text-sm text-gray-600 flex flex-col gap-1">
                                Module description
                                <input
                                  type="text"
                                  value={module.description}
                                  onChange={(event) => handleModuleChange(section.id, module.id, 'description', event.target.value)}
                                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                                  placeholder="Context for this lesson"
                                />
                              </label>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <label className="text-sm text-gray-600 flex flex-col gap-1">
                                Video URL
                                <input
                                  type="url"
                                  value={module.videoUrl}
                                  onChange={(event) => handleModuleChange(section.id, module.id, 'videoUrl', event.target.value)}
                                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                                  placeholder="https://..."
                                />
                              </label>
                              <label className="text-sm text-gray-600 flex flex-col gap-1">
                                Audio URL
                                <input
                                  type="url"
                                  value={module.audioUrl}
                                  onChange={(event) => handleModuleChange(section.id, module.id, 'audioUrl', event.target.value)}
                                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                                  placeholder="https://..."
                                />
                              </label>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                              <label className="text-sm text-gray-600 flex flex-col gap-1">
                                Estimated minutes
                                <input
                                  type="number"
                                  min={5}
                                  value={module.estimatedMinutes}
                                  onChange={(event) => handleModuleChange(section.id, module.id, 'estimatedMinutes', event.target.value)}
                                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                                />
                              </label>
                              <div className="flex flex-col gap-2">
                                <p className="text-sm text-gray-600">Attach audio</p>
                                <div className="flex flex-wrap gap-2">
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    ref={registerFileInput(`${module.id}-audio`)}
                                    className="hidden"
                                    onChange={handleModuleFileInput(section.id, module.id, 'audio')}
                                  />
                                  <button
                                    type="button"
                                    className="px-3 py-2 rounded-lg border text-xs text-gray-700 hover:bg-gray-100"
                                    onClick={() => triggerFilePicker(`${module.id}-audio`)}
                                  >
                                    Upload audio
                                  </button>
                                  {module.audioFileName && (
                                    <span className="text-xs text-gray-500">{module.audioFileName}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <p className="text-sm text-gray-600">Attach workbook / notes</p>
                                <div className="flex flex-wrap gap-2">
                                  <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    ref={registerFileInput(`${module.id}-book`)}
                                    className="hidden"
                                    onChange={handleModuleFileInput(section.id, module.id, 'book')}
                                  />
                                  <button
                                    type="button"
                                    className="px-3 py-2 rounded-lg border text-xs text-gray-700 hover:bg-gray-100"
                                    onClick={() => triggerFilePicker(`${module.id}-book`)}
                                  >
                                    Upload file
                                  </button>
                                  {module.bookFileName && (
                                    <span className="text-xs text-gray-500">{module.bookFileName}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-dashed border-gray-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Section exam</p>
                          <p className="text-xs text-gray-500">
                            Learners must pass this exam to unlock Section {sectionIndex + 2}.
                          </p>
                        </div>
                        <select
                          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                          value={section.exam.status}
                          onChange={(event) =>
                            handleExamChange(section.id, 'status', event.target.value as SectionExamDraft['status'])
                          }
                        >
                          <option value="draft">Draft</option>
                          <option value="ready">Ready</option>
                          <option value="published">Published</option>
                        </select>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-sm text-gray-600 flex flex-col gap-1">
                          Exam title
                          <input
                            type="text"
                            value={section.exam.title}
                            onChange={(event) => handleExamChange(section.id, 'title', event.target.value)}
                            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                            placeholder="Orientation checkpoint"
                          />
                        </label>
                        <label className="text-sm text-gray-600 flex flex-col gap-1">
                          Exam description
                          <input
                            type="text"
                            value={section.exam.description}
                            onChange={(event) => handleExamChange(section.id, 'description', event.target.value)}
                            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                            placeholder="CBT with 20 questions"
                          />
                        </label>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-sm text-gray-600 flex flex-col gap-1">
                          Time limit (minutes)
                          <input
                            type="number"
                            min={5}
                            value={section.exam.timeLimitMinutes}
                            onChange={(event) => handleExamChange(section.id, 'timeLimitMinutes', Number(event.target.value))}
                            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                          />
                        </label>
                        <label className="text-sm text-gray-600 flex flex-col gap-1">
                          Question count
                          <input
                            type="number"
                            min={1}
                            value={section.exam.questionCount}
                            onChange={(event) => handleExamChange(section.id, 'questionCount', Number(event.target.value))}
                            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                          />
                        </label>
                      </div>

                      <div className="flex flex-col gap-2">
                        <p className="text-sm text-gray-600">Upload CBT file</p>
                        <div className="flex flex-wrap gap-2">
                          <input
                            type="file"
                            accept=".csv,.xlsx,.xls,.json"
                            ref={registerFileInput(`exam-${section.id}`)}
                            className="hidden"
                            onChange={handleExamFileInput(section.id)}
                          />
                          <button
                            type="button"
                            className="px-3 py-2 rounded-lg border text-xs text-gray-700 hover:bg-gray-100"
                            onClick={() => triggerFilePicker(`exam-${section.id}`)}
                          >
                            Upload exam file
                          </button>
                          {section.exam.uploadPlaceholder && (
                            <span className="text-xs text-gray-500">{section.exam.uploadPlaceholder}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700 disabled:opacity-60 disabled:hover:bg-primary-600"
                disabled={isSavingDraft}
              >
                {isSavingDraft ? 'Saving draft…' : 'Save draft'}
              </button>
              <button type="button" className="px-4 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50">
                Upload cover
              </button>
            </div>
            {draftMessage && (
              <p className={`text-sm ${draftMessage.startsWith('Unable') ? 'text-amber-600' : 'text-emerald-600'}`}>
                {draftMessage}
              </p>
            )}
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
