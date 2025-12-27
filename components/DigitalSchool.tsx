'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type AccessType = 'open' | 'request' | 'invite'
type ProgressState = 'not-started' | 'in-progress' | 'completed'

type CoursePricing =
  | { type: 'free' }
  | { type: 'paid'; amount: number; currency?: string }

const COURSE_MANAGER_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'BRANCH_ADMIN', 'PASTOR'])

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
  pricing: CoursePricing
  rawStatus?: ApiCourseResponse['status']
}

type ResumeMetadata = {
  courseId: string
  courseTitle: string
  sectionIds: string[]
  modulesBySection: Record<string, string[]>
  examIdsBySection: Record<string, string[]>
}

type EnrollmentQueueItem = {
  enrollmentId: string
  courseId: string
  moduleTitle: string
  due: string
  action: string
  progressPercent?: number
  isCompleted: boolean
  certificateUrl?: string
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

type SectionGatingSummary = {
  enrollmentId: string
  courseId: string
  courseTitle: string
  progress: number
  lockedModules: number
  unlockedModules: number
  statusLabel: string
  nextAction: string
  isCompleted: boolean
  certificateUrl?: string
}

type ModuleContentType = 'video' | 'audio' | 'text'

type ModuleDraft = {
  id: string
  persistedId?: string
  title: string
  description: string
  estimatedMinutes: number
  videoUrl: string
  audioUrl: string
  bookUrl: string
  audioFileName?: string
  bookFileName?: string
  audioStoragePath?: string
  bookStoragePath?: string
  contentType: ModuleContentType
  textContent: string
}

type SectionExamDraft = {
  persistedId?: string
  title: string
  description: string
  timeLimitMinutes: number
  questionCount: number
  status: 'draft' | 'ready' | 'published'
  uploadPlaceholder?: string
  uploadUrl?: string
  uploadStoragePath?: string
}

type SectionDraft = {
  id: string
  persistedId?: string
  title: string
  description: string
  modules: ModuleDraft[]
  exam: SectionExamDraft
}

type CourseDraft = {
  title: string
  access: AccessType
  mentors: string
  summary: string
  estimatedHours: number
  format: string
  pricing: CoursePricing
  sections: SectionDraft[]
  certificateTheme: CertificateThemeDraft
}

type CertificateTemplate = 'classic' | 'modern' | 'minimal'

type CertificateThemeDraft = {
  template: CertificateTemplate
  accentColor: string
  secondaryColor: string
  logoUrl: string
  backgroundImageUrl: string
  signatureText: string
  sealText: string
  issuedBy: string
}

const DEFAULT_CERTIFICATE_THEME: CertificateThemeDraft = {
  template: 'classic',
  accentColor: '#4338ca',
  secondaryColor: '#0f172a',
  logoUrl: '',
  backgroundImageUrl: '',
  signatureText: 'Lead Pastor',
  sealText: 'Ecclesia Training Institute',
  issuedBy: 'Ecclesia',
}

const mergeCertificateTheme = (theme?: Partial<CertificateThemeDraft>): CertificateThemeDraft => ({
  ...DEFAULT_CERTIFICATE_THEME,
  ...theme,
})

const createModuleDraft = (overrides: Partial<ModuleDraft> = {}): ModuleDraft => ({
  id:
    overrides.id ??
    (typeof crypto !== 'undefined' ? crypto.randomUUID() : `module-${Date.now()}-${Math.random()}`),
  persistedId: overrides.persistedId,
  title: overrides.title ?? '',
  description: overrides.description ?? '',
  estimatedMinutes: overrides.estimatedMinutes ?? 30,
  videoUrl: overrides.videoUrl ?? '',
  audioUrl: overrides.audioUrl ?? '',
  bookUrl: overrides.bookUrl ?? '',
  audioFileName: overrides.audioFileName,
  bookFileName: overrides.bookFileName,
  audioStoragePath: overrides.audioStoragePath,
  bookStoragePath: overrides.bookStoragePath,
  contentType: overrides.contentType ?? 'video',
  textContent: overrides.textContent ?? '',
})

const createExamDraft = (overrides: Partial<SectionExamDraft> = {}): SectionExamDraft => ({
  persistedId: overrides.persistedId,
  title: overrides.title ?? '',
  description: overrides.description ?? '',
  timeLimitMinutes: overrides.timeLimitMinutes ?? 30,
  questionCount: overrides.questionCount ?? 20,
  status: overrides.status ?? 'draft',
  uploadPlaceholder: overrides.uploadPlaceholder ?? '',
  uploadUrl: overrides.uploadUrl,
  uploadStoragePath: overrides.uploadStoragePath,
})

const createSectionDraft = (overrides: Partial<SectionDraft> = {}): SectionDraft => ({
  id:
    overrides.id ??
    (typeof crypto !== 'undefined' ? crypto.randomUUID() : `section-${Date.now()}-${Math.random()}`),
  persistedId: overrides.persistedId,
  title: overrides.title ?? '',
  description: overrides.description ?? '',
  modules: overrides.modules ?? [createModuleDraft()],
  exam: overrides.exam ?? createExamDraft(),
})

const createCourseDraft = (): CourseDraft => ({
  title: '',
  access: 'open',
  mentors: '',
  summary: 'Outline what learners should expect from this discipleship track.',
  estimatedHours: 6,
  format: 'Video lessons, Audio reflections',
  pricing: { type: 'free' },
  sections: [createSectionDraft()],
  certificateTheme: mergeCertificateTheme(),
})

const CERTIFICATE_TEMPLATES: { value: CertificateTemplate; label: string; description: string }[] = [
  {
    value: 'classic',
    label: 'Classic',
    description: 'Traditional typography with bold borders and seal.',
  },
  {
    value: 'modern',
    label: 'Modern',
    description: 'Minimal layout with accent blocks and sans-serif fonts.',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Clean monochrome layout with subtle dividers.',
  },
]

const MODULE_CONTENT_TYPES: { value: ModuleContentType; label: string; description: string }[] = [
  { value: 'video', label: 'Video lesson', description: 'Embed a sermon or teaching clip.' },
  { value: 'audio', label: 'Audio reflection', description: 'Upload sermon audio or guided prayer.' },
  { value: 'text', label: 'Text-based study', description: 'Paste a devotional, transcript, or study notes.' },
]

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

const clampProgress = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

const deriveEnrollmentSnapshot = (enrollment: ApiEnrollmentResponse | undefined, course?: Course) => {
  if (!enrollment) {
    return {
      progressPercent: 0,
      status: 'not-started' as ProgressState,
      isCompleted: false,
      actionLabel: 'Begin course',
      moduleLabel: `${course?.title ?? 'Digital Course'} · Ready to start`,
      dueLabel: 'Ready to begin',
    }
  }

  const progressPercent = clampProgress(enrollment.progressPercent)
  const isCompleted = enrollment.status === 'completed'
  const status: ProgressState = isCompleted ? 'completed' : progressPercent > 0 ? 'in-progress' : 'not-started'

  const moduleLabel = isCompleted
    ? `${course?.title ?? 'Digital Course'} · Completed`
    : `${course?.title ?? 'Digital Course'} · ${progressPercent}% done`
  const dueLabel = isCompleted ? 'Certificate ready' : progressPercent > 0 ? `${progressPercent}% complete` : 'Can start now'
  const actionLabel = isCompleted ? 'View certificate' : progressPercent > 0 ? 'Continue course' : 'Begin course'

  return {
    progressPercent,
    status,
    isCompleted,
    moduleLabel,
    dueLabel,
    actionLabel,
  }
}

const buildEnrollmentQueue = (enrollments: ApiEnrollmentResponse[], courses: Course[]): EnrollmentQueueItem[] => {
  if (!enrollments.length) return []
  const courseMap = new Map(courses.map((course) => [course.id, course]))

  return enrollments.map((enrollment) => {
    const course = courseMap.get(enrollment.courseId)
    const snapshot = deriveEnrollmentSnapshot(enrollment, course)
    return {
      enrollmentId: enrollment.id,
      courseId: enrollment.courseId,
      moduleTitle: snapshot.moduleLabel,
      due: snapshot.dueLabel,
      action: snapshot.actionLabel,
      progressPercent: enrollment.progressPercent,
      isCompleted: snapshot.isCompleted,
      certificateUrl: enrollment.certificateUrl,
    }
  })
}

const buildGatingSummaries = (enrollments: ApiEnrollmentResponse[], courses: Course[]): SectionGatingSummary[] => {
  if (!enrollments.length) return []
  const courseMap = new Map(courses.map((course) => [course.id, course]))

  return enrollments.map((enrollment) => {
    const course = courseMap.get(enrollment.courseId)
    const totalModules = course?.modules ?? 0
    const completedModules = Math.min(
      totalModules,
      Math.round(((enrollment.progressPercent ?? 0) / 100) * totalModules),
    )

    const unlockedModules = Math.max(completedModules, 0)
    const lockedModules = Math.max(totalModules - unlockedModules, 0)
    const progress = clampProgress(enrollment.progressPercent)
    const snapshot = deriveEnrollmentSnapshot(enrollment, course)

    const nextAction = snapshot.isCompleted
      ? 'Download certificate'
      : lockedModules > 0
        ? 'Pass section exam to unlock next modules'
        : 'All modules unlocked'

    const statusLabel = snapshot.isCompleted
      ? 'Completed'
      : lockedModules > 0
        ? `${lockedModules} modules locked`
        : 'Unlocked'

    return {
      enrollmentId: enrollment.id,
      courseId: enrollment.courseId,
      courseTitle: course?.title ?? 'Digital Course',
      progress,
      lockedModules,
      unlockedModules,
      statusLabel,
      nextAction,
      isCompleted: snapshot.isCompleted,
      certificateUrl: enrollment.certificateUrl,
    }
  })
}

const buildProgressRows = (enrollments: ApiEnrollmentResponse[], courses: Course[]): ProgressRow[] => {
  if (!enrollments.length) return []
  const courseMap = new Map(courses.map((course) => [course.id, course]))

  return enrollments.map((enrollment) => {
    const course = courseMap.get(enrollment.courseId)
    const completion = clampProgress(enrollment.progressPercent)
    const examScore =
      enrollment.status === 'completed'
        ? 'Passed'
        : completion >= 80
          ? 'Ready for exam'
          : '-'

    return {
      member: 'You',
      course: course?.title ?? 'Digital Course',
      completion,
      examScore,
    }
  })
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
  certificateTheme?: Partial<CertificateThemeDraft>
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
    rawStatus: apiCourse.status ?? 'draft',
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
  description?: string
  order?: number
  estimatedMinutes?: number
  videoUrl?: string
  audioUrl?: string
  audioFileName?: string
  audioStoragePath?: string
  bookUrl?: string
  bookFileName?: string
  bookStoragePath?: string
  contentType?: ModuleContentType
  textContent?: string
}

type ApiExamResponse = {
  id: string
  sectionId: string
  title: string
  description?: string
  status: string
  timeLimitMinutes?: number
  questionCount?: number
  uploadMetadata?: {
    source?: string
    originalFileName?: string
    fileUrl?: string
    storagePath?: string
  }
}

type ApiEnrollmentResponse = {
  id: string
  courseId: string
  userId: string
  status: 'active' | 'completed' | 'withdrawn'
  progressPercent?: number
  moduleProgress?: Record<string, number>
  badgeIssuedAt?: string
  certificateUrl?: string
}

type DigitalSchoolUploadResponse = {
  success: boolean
  url: string
  path: string
  fileName: string
  originalName?: string
  size: number
  contentType: string
  metadata?: {
    courseId?: string
    sectionId?: string
    moduleId?: string
    type?: string
  }
}

const requestJson = async <T,>(url: string, init: RequestInit = {}): Promise<T> => {
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

async function uploadDigitalSchoolFile(
  file: File,
  params: {
    type: 'moduleAudio' | 'moduleBook' | 'examUpload'
    courseId?: string
    sectionId?: string
    moduleId?: string
  },
): Promise<DigitalSchoolUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', params.type)
  if (params.courseId) formData.append('courseId', params.courseId)
  if (params.sectionId) formData.append('sectionId', params.sectionId)
  if (params.moduleId) formData.append('moduleId', params.moduleId)

  const response = await fetch('/api/digital-school/uploads', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })

  let data: any = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error((data && data.error) || 'File upload failed')
  }

  return data as DigitalSchoolUploadResponse
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

export default function DigitalSchool() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [draftCourses, setDraftCourses] = useState<ApiCourseResponse[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentQueueItem[]>([])
  const [adminActions, setAdminActions] = useState<AdminAction[]>([])
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [examUploads, setExamUploads] = useState<ExamUpload[]>([])
  const [progressRows, setProgressRows] = useState<ProgressRow[]>([])
  const [selectedProgress, setSelectedProgress] = useState<ProgressRow | null>(null)
  const [courseDraft, setCourseDraft] = useState<CourseDraft>(createCourseDraft())
  const [resumeMetadata, setResumeMetadata] = useState<ResumeMetadata | null>(null)
  const [draftMessage, setDraftMessage] = useState<string | null>(null)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [certificateMessage, setCertificateMessage] = useState<string | null>(null)
  const [reminderMessages, setReminderMessages] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [certificateLoading, setCertificateLoading] = useState<Record<string, boolean>>({})
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false)
  const [isSavingCourse, setIsSavingCourse] = useState(false)
  const [submitIntent, setSubmitIntent] = useState<'draft' | 'published'>('draft')
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [resumingCourseId, setResumingCourseId] = useState<string | null>(null)
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null)
  const [isCourseManager, setIsCourseManager] = useState(false)
  const examUploadInputRef = useRef<HTMLInputElement | null>(null)
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({})
  const [uploadingTargets, setUploadingTargets] = useState<Record<string, boolean>>({})
  const [enrollmentRecords, setEnrollmentRecords] = useState<ApiEnrollmentResponse[]>([])
  const [gatingSummaries, setGatingSummaries] = useState<SectionGatingSummary[]>([])

  const supportsCourseArchive = false // TODO: replace deletions with archive/undo flow when audit requirements land.

  const setUploadingState = useCallback((key: string, value: boolean) => {
    setUploadingTargets((prev) => {
      if (value) {
        return {
          ...prev,
          [key]: true,
        }
      }
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const isUploading = useCallback((key: string) => Boolean(uploadingTargets[key]), [uploadingTargets])
  const setCertificateLoadingState = useCallback((id: string, value: boolean) => {
    setCertificateLoading((prev) => {
      if (value) {
        return {
          ...prev,
          [id]: true,
        }
      }
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const loadCourses = useCallback(async () => {
    setIsLoadingCourses(true)
    try {
      const apiCourses = await requestJson<ApiCourseResponse[]>('/api/digital-school/courses')
      if (Array.isArray(apiCourses) && apiCourses.length) {
        setCourses(apiCourses.map(mapApiCourseToUi))
        setDraftCourses(apiCourses.filter((course) => course.status === 'draft'))
      } else {
        setDraftCourses([])
      }
    } catch (error) {
      console.error('DigitalSchool.loadCourses', error)
    } finally {
      setIsLoadingCourses(false)
    }
  }, [])

  const loadEnrollments = useCallback(async () => {
    setIsLoadingEnrollments(true)
    try {
      const apiEnrollments = await requestJson<ApiEnrollmentResponse[]>('/api/digital-school/enrollments')
      setEnrollmentRecords(Array.isArray(apiEnrollments) ? apiEnrollments : [])
    } catch (error) {
      console.error('DigitalSchool.loadEnrollments', error)
    } finally {
      setIsLoadingEnrollments(false)
    }
  }, [])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  useEffect(() => {
    loadEnrollments()
  }, [loadEnrollments])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          const role = String(data?.role || '').toUpperCase()
          setIsCourseManager(COURSE_MANAGER_ROLES.has(role))
        }
      } catch (error) {
        console.error('DigitalSchool.loadViewerRole', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(id)
  }, [toast])

  useEffect(() => {
    setEnrollments(buildEnrollmentQueue(enrollmentRecords, courses))
    setProgressRows(buildProgressRows(enrollmentRecords, courses))
    setGatingSummaries(buildGatingSummaries(enrollmentRecords, courses))
  }, [enrollmentRecords, courses])

  useEffect(() => {
    if (!isBuilderOpen) return
    if (typeof document === 'undefined') return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isBuilderOpen])

  const closeBuilder = useCallback(() => {
    setIsBuilderOpen(false)
  }, [])

  useEffect(() => {
    if (!isBuilderOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeBuilder()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeBuilder, isBuilderOpen])

  const resetBuilderState = useCallback((options?: { message?: string | null }) => {
    setCourseDraft(createCourseDraft())
    setResumeMetadata(null)
    setDraftMessage(options?.message ?? null)
    fileInputsRef.current = {}
  }, [])

  const closeAndResetBuilder = useCallback(
    (options?: { message?: string | null }) => {
      resetBuilderState({ message: options?.message ?? null })
      setIsBuilderOpen(false)
    },
    [resetBuilderState],
  )

  const handleResetBuilder = useCallback(() => {
    resetBuilderState({ message: 'Started a fresh draft builder.' })
  }, [resetBuilderState])

  const handleOpenNewCourse = useCallback(() => {
    resetBuilderState({ message: null })
    setIsBuilderOpen(true)
  }, [resetBuilderState])

  const handleResumeDraft = useCallback(
    async (courseId: string) => {
      setResumingCourseId(courseId)
      setDraftMessage(null)
      setIsBuilderOpen(true)
      try {
        const courseDetails = await requestJson<ApiCourseResponse>(`/api/digital-school/courses/${courseId}`)
        const sections = await requestJson<ApiSectionResponse[]>(`/api/digital-school/sections?courseId=${courseId}`)

        const builtSections = await Promise.all(
          (sections ?? []).map(async (section) => {
            const [modules, exams] = await Promise.all([
              requestJson<ApiModuleResponse[]>(
                `/api/digital-school/modules?courseId=${courseId}&sectionId=${section.id}`,
              ),
              requestJson<ApiExamResponse[]>(
                `/api/digital-school/exams?courseId=${courseId}&sectionId=${section.id}`,
              ),
            ])

            const moduleDrafts =
              Array.isArray(modules) && modules.length
                ? modules.map((module) =>
                    createModuleDraft({
                      id: module.id,
                      persistedId: module.id,
                      title: module.title,
                      description: module.description ?? '',
                      estimatedMinutes: module.estimatedMinutes ?? 30,
                      videoUrl: module.videoUrl ?? '',
                      audioUrl: module.audioUrl ?? '',
                      audioFileName: module.audioFileName,
                      audioStoragePath: module.audioStoragePath,
                      bookUrl: module.bookUrl ?? '',
                      bookFileName: module.bookFileName,
                      bookStoragePath: module.bookStoragePath,
                      contentType: module.contentType ?? 'video',
                      textContent: module.textContent ?? '',
                    }),
                  )
                : [createModuleDraft()]

            const examPayload = Array.isArray(exams) ? exams[0] : undefined
            const examDraft = createExamDraft({
              persistedId: examPayload?.id,
              title: examPayload?.title ?? '',
              description: examPayload?.description ?? '',
              timeLimitMinutes: examPayload?.timeLimitMinutes ?? 30,
              questionCount: examPayload?.questionCount ?? 20,
              status: (examPayload?.status as SectionExamDraft['status']) ?? 'draft',
              uploadPlaceholder: examPayload?.uploadMetadata?.originalFileName ?? '',
              uploadUrl: examPayload?.uploadMetadata?.fileUrl,
              uploadStoragePath: examPayload?.uploadMetadata?.storagePath,
            })

            return createSectionDraft({
              id: section.id,
              persistedId: section.id,
              title: section.title,
              description: section.description ?? '',
              modules: moduleDrafts,
              exam: examDraft,
            })
          }),
        )

        const nextSections = builtSections.length ? builtSections : [createSectionDraft()]
        const mentors = courseDetails.mentors?.join(', ') ?? ''
        const formatTags = courseDetails.tags?.join(', ') ?? ''

        setCourseDraft({
          title: courseDetails.title ?? '',
          access: courseDetails.accessType ?? 'open',
          mentors,
          summary: courseDetails.summary ?? '',
          estimatedHours: courseDetails.estimatedHours ?? 6,
          format: formatTags,
          pricing: courseDetails.pricing ?? { type: 'free' },
          sections: nextSections,
          certificateTheme: mergeCertificateTheme(courseDetails.certificateTheme),
        })

        const modulesBySection: ResumeMetadata['modulesBySection'] = {}
        const examIdsBySection: ResumeMetadata['examIdsBySection'] = {}

        nextSections.forEach((section) => {
          const sectionKey = section.persistedId ?? section.id
          modulesBySection[sectionKey] = section.modules
            .map((module) => module.persistedId)
            .filter((id): id is string => Boolean(id))
          if (section.exam.persistedId) {
            examIdsBySection[sectionKey] = [section.exam.persistedId]
          }
        })

        setResumeMetadata({
          courseId,
          courseTitle: courseDetails.title ?? 'Draft course',
          sectionIds: nextSections.map((section) => section.persistedId ?? section.id),
          modulesBySection,
          examIdsBySection,
        })
        fileInputsRef.current = {}
        setDraftMessage(`Loaded "${courseDetails.title}" draft — continue editing then save to update.`)
      } catch (error) {
        console.error('DigitalSchool.handleResumeDraft', error)
        setDraftMessage(null)
        const message =
          error instanceof Error && /requires an index/i.test(error.message)
            ? 'Unable to load draft. Please create the suggested Firestore index and try again.'
            : error instanceof Error
              ? `Unable to load draft: ${error.message}`
              : 'Unable to load draft right now.'
        setToast({ message, tone: 'error' })
      } finally {
        setResumingCourseId(null)
      }
    },
    [],
  )

  const handleEditCourse = useCallback(
    (courseId: string) => {
      void handleResumeDraft(courseId)
    },
    [handleResumeDraft],
  )

  const handleDeleteCourse = useCallback(
    async (courseId: string) => {
      if (deletingCourseId || supportsCourseArchive) return
      const course = courses.find((item) => item.id === courseId)
      const confirmed = window.confirm(
        course ? `Delete "${course.title}" and its draft data? This cannot be undone.` : 'Delete this course draft?',
      )
      if (!confirmed) return
      setDeletingCourseId(courseId)
      try {
        await requestJson(`/api/digital-school/courses/${courseId}`, { method: 'DELETE' })
        if (resumeMetadata?.courseId === courseId) {
          closeAndResetBuilder({ message: 'Deleted draft builder.' })
        }
        await loadCourses()
        setToast({
          message: `Removed "${course?.title ?? 'draft'}" from catalog.`,
          tone: 'success',
        })
      } catch (error) {
        console.error('DigitalSchool.handleDeleteCourse', error)
        setToast({
          message: error instanceof Error ? `Unable to delete: ${error.message}` : 'Unable to delete course.',
          tone: 'error',
        })
      } finally {
        setDeletingCourseId(null)
      }
    },
    [closeAndResetBuilder, courses, deletingCourseId, loadCourses, resumeMetadata?.courseId, supportsCourseArchive],
  )

  const courseActionLabel = (course: Course, enrollment?: ApiEnrollmentResponse) => {
    const snapshot = deriveEnrollmentSnapshot(enrollment, course)
    if (snapshot.isCompleted) return 'View certificate'
    if (snapshot.status === 'in-progress') return 'Continue course'
    if (snapshot.status === 'not-started' && course.access === 'open') return 'Begin course'
    if (course.access === 'request') return 'Request access'
    if (course.access === 'invite') return 'Accept invite'
    return 'Begin course'
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

  const handleCertificateThemeChange = useCallback(
    (field: keyof CertificateThemeDraft, value: string | CertificateTemplate) => {
      setCourseDraft((prev) => ({
        ...prev,
        certificateTheme: {
          ...prev.certificateTheme,
          [field]: value,
        },
      }))
    },
    []
  )

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

  type ModuleEditableField =
    | 'title'
    | 'description'
    | 'videoUrl'
    | 'audioUrl'
    | 'bookUrl'
    | 'estimatedMinutes'
    | 'contentType'
    | 'textContent'

  const handleModuleChange = (sectionId: string, moduleId: string, field: ModuleEditableField, value: string) => {
    updateSections((sections) =>
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              modules: section.modules.map((module) =>
                module.id === moduleId
                  ? (() => {
                      if (field === 'estimatedMinutes') {
                        return {
                          ...module,
                          estimatedMinutes: Math.max(5, Number(value) || 0),
                        }
                      }

                      if (field === 'contentType') {
                        const nextType = value as ModuleContentType
                        const resets: Partial<ModuleDraft> =
                          nextType === 'video'
                            ? {
                                audioUrl: '',
                                audioFileName: undefined,
                                audioStoragePath: undefined,
                                textContent: '',
                              }
                            : nextType === 'audio'
                              ? {
                                  videoUrl: '',
                                  textContent: '',
                                }
                              : {
                                  videoUrl: '',
                                  audioUrl: '',
                                  audioFileName: undefined,
                                  audioStoragePath: undefined,
                                }

                        return {
                          ...module,
                          ...resets,
                          contentType: nextType,
                        }
                      }

                      return {
                        ...module,
                        [field]: value,
                      }
                    })()
                  : module,
              ),
            }
          : section,
      ),
    )
  }

  const handleModuleFileChange = async (sectionId: string, moduleId: string, type: 'audio' | 'book', file: File | null) => {
    if (!file) return
    const uploadKey = `${moduleId}-${type}`
    setUploadingState(uploadKey, true)
    try {
      const upload = await uploadDigitalSchoolFile(file, {
        type: type === 'audio' ? 'moduleAudio' : 'moduleBook',
        sectionId,
        moduleId,
      })

      updateSections((sections) =>
        sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                modules: section.modules.map((module) =>
                  module.id === moduleId
                    ? {
                        ...module,
                        audioFileName: type === 'audio' ? upload.originalName || upload.fileName : module.audioFileName,
                        bookFileName: type === 'book' ? upload.originalName || upload.fileName : module.bookFileName,
                        audioUrl: type === 'audio' ? upload.url : module.audioUrl,
                        bookUrl: type === 'book' ? upload.url : module.bookUrl,
                        audioStoragePath: type === 'audio' ? upload.path : module.audioStoragePath,
                        bookStoragePath: type === 'book' ? upload.path : module.bookStoragePath,
                      }
                    : module,
                ),
              }
            : section,
        ),
      )
      setUploadMessage(`Uploaded ${file.name}`)
    } catch (error) {
      console.error('DigitalSchool.handleModuleFileChange', error)
      setUploadMessage(error instanceof Error ? `Upload failed: ${error.message}` : 'Unable to upload file.')
    } finally {
      setUploadingState(uploadKey, false)
    }
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

  const handleExamFileChange = async (sectionId: string, file: File | null) => {
    if (!file) return
    const uploadKey = `exam-${sectionId}`
    setUploadingState(uploadKey, true)
    try {
      const upload = await uploadDigitalSchoolFile(file, { type: 'examUpload', sectionId })
      updateSections((sections) =>
        sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                exam: {
                  ...section.exam,
                  uploadPlaceholder: upload.originalName || upload.fileName,
                  uploadUrl: upload.url,
                  uploadStoragePath: upload.path,
                },
              }
            : section,
        ),
      )
      setUploadMessage(`Uploaded ${file.name}`)
    } catch (error) {
      console.error('DigitalSchool.handleExamFileChange', error)
      setUploadMessage(error instanceof Error ? `Upload failed: ${error.message}` : 'Unable to upload exam file.')
    } finally {
      setUploadingState(uploadKey, false)
    }
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
    (sectionId: string, moduleId: string, type: 'audio' | 'book') => async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null
      event.target.value = ''
      if (!file) return
      await handleModuleFileChange(sectionId, moduleId, type, file)
    }

  const handleExamFileInput = (sectionId: string) => async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    event.target.value = ''
    if (!file) return
    await handleExamFileChange(sectionId, file)
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
    if (isSavingCourse) return

    const submitEvent = event.nativeEvent as SubmitEvent
    const submitter = submitEvent?.submitter as HTMLButtonElement | null
    const desiredIntent = (submitter?.dataset.intent as 'draft' | 'published') ?? submitIntent ?? 'draft'

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

    const coursePayload = {
      title: courseDraft.title.trim(),
      summary: courseDraft.summary?.trim() || 'New discipleship modules launching soon.',
      accessType: courseDraft.access,
      mentors,
      estimatedHours: Math.max(1, Math.round(courseDraft.estimatedHours)),
      tags: formatTags,
      status: desiredIntent,
      pricing: courseDraft.pricing,
      certificateTheme: courseDraft.certificateTheme,
    }

    setIsSavingCourse(true)
    setSubmitIntent(desiredIntent)
    setDraftMessage(null)

    try {
      if (resumeMetadata?.courseId) {
        const courseId = resumeMetadata.courseId
        await requestJson<ApiCourseResponse>(`/api/digital-school/courses/${courseId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(coursePayload),
        })

        const existingSectionIds = new Set(resumeMetadata.sectionIds)
        const nextSectionIds: string[] = []
        const nextModulesBySection: ResumeMetadata['modulesBySection'] = {}
        const nextExamIdsBySection: ResumeMetadata['examIdsBySection'] = {}
        const sectionPersistedMap: Record<string, string> = {}
        const modulePersistedMap: Record<string, string> = {}
        const examPersistedMap: Record<string, string | undefined> = {}

        for (const [sectionIndex, section] of courseDraft.sections.entries()) {
          const sectionMinutes = section.modules.reduce((total, module) => total + module.estimatedMinutes, 0)
          const sectionHours = Math.max(1, Math.round(sectionMinutes / 60) || 1)
          const baseSectionPayload = {
            title: section.title.trim() || `Section ${sectionIndex + 1}`,
            description: section.description,
            order: sectionIndex + 1,
            estimatedHours: sectionHours,
          }

          let persistedSectionId = section.persistedId
          if (persistedSectionId) {
            await requestJson<ApiSectionResponse>(`/api/digital-school/sections/${persistedSectionId}`, {
              method: 'PUT',
              headers,
              body: JSON.stringify(baseSectionPayload),
            })
            existingSectionIds.delete(persistedSectionId)
          } else {
            const createdSection = await requestJson<ApiSectionResponse>('/api/digital-school/sections', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                ...baseSectionPayload,
                courseId,
              }),
            })
            persistedSectionId = createdSection.id
          }

          if (!persistedSectionId) continue
          sectionPersistedMap[section.id] = persistedSectionId
          nextSectionIds.push(persistedSectionId)

          const existingModuleIds = new Set(resumeMetadata.modulesBySection[persistedSectionId] ?? [])
          const moduleIdsForMetadata: string[] = []

          for (const [moduleIndex, module] of section.modules.entries()) {
            const modulePayload = {
              title: module.title.trim() || `Module ${moduleIndex + 1}`,
              description: module.description,
              order: moduleIndex + 1,
              estimatedMinutes: module.estimatedMinutes,
              videoUrl: module.videoUrl || undefined,
              audioUrl: module.audioUrl || undefined,
              audioFileName: module.audioFileName,
              audioStoragePath: module.audioStoragePath,
              bookUrl: module.bookUrl || undefined,
              bookFileName: module.bookFileName,
              bookStoragePath: module.bookStoragePath,
              contentType: module.contentType,
              textContent: module.textContent || undefined,
            }

            if (module.persistedId) {
              await requestJson<ApiModuleResponse>(`/api/digital-school/modules/${module.persistedId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(modulePayload),
              })
              existingModuleIds.delete(module.persistedId)
              moduleIdsForMetadata.push(module.persistedId)
              modulePersistedMap[module.id] = module.persistedId
            } else {
              const createdModule = await requestJson<ApiModuleResponse>('/api/digital-school/modules', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  ...modulePayload,
                  courseId,
                  sectionId: persistedSectionId,
                }),
              })
              moduleIdsForMetadata.push(createdModule.id)
              modulePersistedMap[module.id] = createdModule.id
            }
          }

          for (const orphanModuleId of existingModuleIds) {
            await requestJson(`/api/digital-school/modules/${orphanModuleId}`, {
              method: 'DELETE',
            })
          }

          nextModulesBySection[persistedSectionId] = moduleIdsForMetadata

          const previousExamId = resumeMetadata.examIdsBySection[persistedSectionId]?.[0]
          const examPayload = {
            title: section.exam.title.trim() || `${section.title || `Section ${sectionIndex + 1}`} exam`,
            description: section.exam.description,
            timeLimitMinutes: section.exam.timeLimitMinutes,
            status: section.exam.status,
            questionCount: section.exam.questionCount,
            uploadMetadata: section.exam.uploadPlaceholder
              ? {
                  source: 'admin-upload',
                  originalFileName: section.exam.uploadPlaceholder,
                  fileUrl: section.exam.uploadUrl,
                  storagePath: section.exam.uploadStoragePath,
                }
              : undefined,
          }

          let resolvedExamId = section.exam.persistedId
          if (resolvedExamId) {
            await requestJson<ApiExamResponse>(`/api/digital-school/exams/${resolvedExamId}`, {
              method: 'PUT',
              headers,
              body: JSON.stringify(examPayload),
            })
          } else {
            if (previousExamId) {
              await requestJson(`/api/digital-school/exams/${previousExamId}`, {
                method: 'DELETE',
              })
            }
            const createdExam = await requestJson<ApiExamResponse>('/api/digital-school/exams', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                ...examPayload,
                courseId,
                sectionId: persistedSectionId,
              }),
            })
            resolvedExamId = createdExam.id
          }

          if (resolvedExamId) {
            nextExamIdsBySection[persistedSectionId] = [resolvedExamId]
            examPersistedMap[section.id] = resolvedExamId
          } else {
            nextExamIdsBySection[persistedSectionId] = []
          }
        }

        for (const orphanSectionId of existingSectionIds) {
          const orphanModuleIds = resumeMetadata.modulesBySection[orphanSectionId] ?? []
          for (const moduleId of orphanModuleIds) {
            await requestJson(`/api/digital-school/modules/${moduleId}`, { method: 'DELETE' })
          }
          const orphanExamIds = resumeMetadata.examIdsBySection[orphanSectionId] ?? []
          for (const examId of orphanExamIds) {
            await requestJson(`/api/digital-school/exams/${examId}`, { method: 'DELETE' })
          }
          await requestJson(`/api/digital-school/sections/${orphanSectionId}`, { method: 'DELETE' })
        }

        await loadCourses()

        setResumeMetadata({
          courseId,
          courseTitle: coursePayload.title,
          sectionIds: nextSectionIds,
          modulesBySection: nextModulesBySection,
          examIdsBySection: nextExamIdsBySection,
        })

        setCourseDraft((prev) => ({
          ...prev,
          sections: prev.sections.map((section) => ({
            ...section,
            persistedId: sectionPersistedMap[section.id] ?? section.persistedId,
            modules: section.modules.map((module) => ({
              ...module,
              persistedId: modulePersistedMap[module.id] ?? module.persistedId,
            })),
            exam: {
              ...section.exam,
              persistedId: examPersistedMap[section.id] ?? section.exam.persistedId,
            },
          })),
        }))

        setDraftMessage(`Updated "${coursePayload.title}" draft – ${courseDraft.sections.length} sections synced.`)
      } else {
        const createdCourse = await requestJson<ApiCourseResponse>('/api/digital-school/courses', {
          method: 'POST',
          headers,
          body: JSON.stringify(coursePayload),
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
                videoUrl: module.videoUrl || undefined,
                audioUrl: module.audioUrl || undefined,
                audioFileName: module.audioFileName,
                audioStoragePath: module.audioStoragePath,
                bookUrl: module.bookUrl || undefined,
                bookFileName: module.bookFileName,
                bookStoragePath: module.bookStoragePath,
                contentType: module.contentType,
                textContent: module.textContent || undefined,
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
              questionCount: section.exam.questionCount,
              uploadMetadata: section.exam.uploadPlaceholder
                ? {
                    source: 'admin-upload',
                    originalFileName: section.exam.uploadPlaceholder,
                    fileUrl: section.exam.uploadUrl,
                    storagePath: section.exam.uploadStoragePath,
                  }
                : undefined,
            }),
          })
        }

        await loadCourses()

        setAdminActions((prev) => [
          {
            title: `${coursePayload.title} · Module Builder`,
            status:
              desiredIntent === 'published'
                ? `Published (${courseDraft.sections.length} sections · ${moduleCount} modules)`
                : `Draft saved (${courseDraft.sections.length} sections · ${moduleCount} modules)`,
            updatedBy: 'You',
            timestamp: 'Just now',
          },
          ...prev,
        ])

        setCourseDraft(createCourseDraft())
        setResumeMetadata(null)
        fileInputsRef.current = {}
        setDraftMessage(
          desiredIntent === 'published'
            ? `Published "${coursePayload.title}" — now visible in the catalog.`
            : `Saved "${coursePayload.title}" draft – ready for scheduled reminders and exams.`,
        )
      }

      setToast({
        message:
          desiredIntent === 'published' ? `Published "${coursePayload.title}".` : `Saved "${coursePayload.title}" as draft.`,
        tone: 'success',
      })

      if (desiredIntent === 'published') {
        closeAndResetBuilder()
      }
    } catch (error) {
      console.error('DigitalSchool.handleSaveDraft', error)
      setDraftMessage(error instanceof Error ? `Unable to save draft: ${error.message}` : 'Unable to save draft right now.')
    } finally {
      setIsSavingCourse(false)
      setSubmitIntent('draft')
    }
  }

  const builderModal =
    isCourseManager && isBuilderOpen ? (
      <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="course-builder-title">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden="true" onClick={closeBuilder} />
        <div className="relative z-10 flex h-full w-full items-center justify-center p-4 md:p-8">
          <div className="relative flex w-full max-w-5xl max-h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 bg-white/95 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Admin cockpit</p>
                <h2 id="course-builder-title" className="text-xl font-semibold text-gray-900">
                  Course creation workflow
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {resumeMetadata ? `Resuming "${resumeMetadata.courseTitle}"` : 'Starting a new draft'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeBuilder}
                className="ml-auto inline-flex items-center rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Close
                <span className="ml-1 text-base leading-none">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                <div className="rounded-2xl border border-dashed border-gray-200 p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Resume draft</p>
                      <p className="text-sm text-gray-600">
                        Pull an existing Digital School draft into this builder without losing your latest edits.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetBuilder}
                      className="px-3 py-1.5 rounded-lg border text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                      disabled={!resumeMetadata}
                    >
                      Start fresh
                    </button>
                  </div>

                  {draftCourses.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No saved drafts yet—click <span className="font-semibold text-gray-700">Save draft</span> after filling the form to
                      store your progress.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {draftCourses.map((draft) => {
                        const isActive = resumeMetadata?.courseId === draft.id
                        const isLoading = resumingCourseId === draft.id
                        return (
                          <div
                            key={draft.id}
                            className={`rounded-2xl border p-3 flex flex-col gap-1 ${
                              isActive ? 'border-primary-300 bg-primary-50/40' : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{draft.title}</p>
                                <p className="text-xs text-gray-500">
                                  {draft.estimatedHours ?? '—'} hrs · {(draft.tags?.length ?? 0) + (draft.moduleCount ?? 0)} items
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => void handleResumeDraft(draft.id)}
                                disabled={isLoading}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60"
                              >
                                {isLoading ? 'Loading…' : isActive ? 'Draft loaded' : 'Resume draft'}
                              </button>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{draft.summary || 'Draft summary pending.'}</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
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
                    Course summary
                    <textarea
                      placeholder="Outline what learners should expect from this discipleship journey..."
                      value={courseDraft.summary}
                      onChange={(event) => handleDraftChange('summary', event.target.value)}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                      rows={3}
                    />
                  </label>
                  <div className="space-y-6">
                    <div className="border rounded-2xl p-4 space-y-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Certificate branding</p>
                          <h3 className="text-sm font-semibold text-gray-900">Customize completion certificates</h3>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm text-gray-600 flex flex-col gap-1">
                          Certificate template
                          <select
                            value={courseDraft.certificateTheme.template}
                            onChange={(event) =>
                              handleCertificateThemeChange('template', event.target.value as CertificateTemplate)
                            }
                            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                          >
                            {CERTIFICATE_TEMPLATES.map((template) => (
                              <option key={template.value} value={template.value}>
                                {template.label}
                              </option>
                            ))}
                          </select>
                          <span className="text-xs text-gray-500">
                            {CERTIFICATE_TEMPLATES.find((item) => item.value === courseDraft.certificateTheme.template)?.description}
                          </span>
                        </label>
                        <label className="text-sm text-gray-600 flex flex-col gap-1">
                          Issued by
                          <input
                            type="text"
                            value={courseDraft.certificateTheme.issuedBy}
                            onChange={(event) => handleCertificateThemeChange('issuedBy', event.target.value)}
                            placeholder="Ecclesia Digital School"
                            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                          />
                        </label>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <label className="text-sm text-gray-600 flex flex-col gap-1">
                          Accent color
                          <input
                            type="color"
                            value={courseDraft.certificateTheme.accentColor}
                            onChange={(event) => handleCertificateThemeChange('accentColor', event.target.value)}
                            className="h-10 rounded-xl border border-gray-200 px-2 py-1"
                          />
                        </label>
                        <label className="text-sm text-gray-600 flex flex-col gap-1">
                          Secondary color
                          <input
                            type="color"
                            value={courseDraft.certificateTheme.secondaryColor}
                            onChange={(event) => handleCertificateThemeChange('secondaryColor', event.target.value)}
                            className="h-10 rounded-xl border border-gray-200 px-2 py-1"
                          />
                        </label>
                        <label className="text-sm text-gray-600 flex flex-col gap-1">
                          Seal text
                          <input
                            type="text"
                            value={courseDraft.certificateTheme.sealText}
                            onChange={(event) => handleCertificateThemeChange('sealText', event.target.value)}
                            placeholder="Ecclesia Training Institute"
                            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                          />
                        </label>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm text-gray-600 flex flex-col gap-1">
                          Signature text
                          <input
                            type="text"
                            value={courseDraft.certificateTheme.signatureText}
                            onChange={(event) => handleCertificateThemeChange('signatureText', event.target.value)}
                            placeholder="Lead Pastor"
                            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                          />
                        </label>
                        <label className="text-sm text-gray-600 flex flex-col gap-1">
                          Background image URL
                          <input
                            type="url"
                            value={courseDraft.certificateTheme.backgroundImageUrl}
                            onChange={(event) => handleCertificateThemeChange('backgroundImageUrl', event.target.value)}
                            placeholder="https://..."
                            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                          />
                        </label>
                      </div>
                      <label className="text-sm text-gray-600 flex flex-col gap-1">
                        Logo URL
                        <input
                          type="url"
                          value={courseDraft.certificateTheme.logoUrl}
                          onChange={(event) => handleCertificateThemeChange('logoUrl', event.target.value)}
                          placeholder="https://..."
                          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                        />
                      </label>
                    </div>

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
                              <p className="text-sm text-gray-500">
                                Every section ends with an exam that must be passed to unlock the next stage.
                              </p>
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
                                      Content format
                                      <select
                                        value={module.contentType}
                                        onChange={(event) => handleModuleChange(section.id, module.id, 'contentType', event.target.value)}
                                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                                      >
                                        {MODULE_CONTENT_TYPES.map((type) => (
                                          <option key={type.value} value={type.value}>
                                            {type.label}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <div className="text-xs text-gray-500 bg-white rounded-xl border border-dashed border-gray-200 px-3 py-3">
                                      {MODULE_CONTENT_TYPES.find((type) => type.value === module.contentType)?.description ??
                                        'Select the media format for this module.'}
                                    </div>
                                  </div>

                                  {module.contentType === 'video' && (
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
                                  )}

                                  {module.contentType === 'audio' && (
                                    <div className="grid gap-3 md:grid-cols-2">
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
                                    </div>
                                  )}

                                  {module.contentType === 'text' && (
                                    <label className="text-sm text-gray-600 flex flex-col gap-1">
                                      Lesson text
                                      <textarea
                                        value={module.textContent}
                                        onChange={(event) =>
                                          handleModuleChange(section.id, module.id, 'textContent', event.target.value)
                                        }
                                        placeholder="Paste your devotional, transcript, or study outline…"
                                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                                        rows={4}
                                      />
                                    </label>
                                  )}

                                  <div className="grid gap-3 md:grid-cols-3">
                                    <label className="text-sm text-gray-600 flex flex-col gap-1">
                                      Estimated minutes
                                      <input
                                        type="number"
                                        min={5}
                                        value={module.estimatedMinutes}
                                        onChange={(event) =>
                                          handleModuleChange(section.id, module.id, 'estimatedMinutes', event.target.value)
                                        }
                                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                                      />
                                    </label>
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
                                  onChange={(event) =>
                                    handleExamChange(section.id, 'timeLimitMinutes', Number(event.target.value))
                                  }
                                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                                />
                              </label>
                              <label className="text-sm text-gray-600 flex flex-col gap-1">
                                Question count
                                <input
                                  type="number"
                                  min={1}
                                  value={section.exam.questionCount}
                                  onChange={(event) =>
                                    handleExamChange(section.id, 'questionCount', Number(event.target.value))
                                  }
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
                      data-intent="draft"
                      className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 disabled:opacity-60"
                      disabled={isSavingCourse}
                    >
                      {isSavingCourse && submitIntent === 'draft' ? 'Saving…' : 'Save as draft'}
                    </button>
                    <button
                      type="submit"
                      data-intent="published"
                      className="px-4 py-2 rounded-lg bg-primary-600 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
                      disabled={isSavingCourse}
                    >
                      {isSavingCourse && submitIntent === 'published' ? 'Publishing…' : 'Publish course'}
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
            </div>
          </div>
        </div>
      </div>
    ) : null

  const openCertificate = useCallback((url: string) => {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    anchor.click()
  }, [])

  const handleGenerateCertificate = async (enrollmentId: string) => {
    setCertificateMessage(null)
    setCertificateLoadingState(enrollmentId, true)
    try {
      const response = await requestJson<{ url: string; path: string }>(
        `/api/digital-school/enrollments/${enrollmentId}/certificate`,
        {
          method: 'POST',
        },
      )
      setCertificateMessage('Certificate ready — opening in a new tab.')
      openCertificate(response.url)
      await loadEnrollments()
    } catch (error) {
      console.error('DigitalSchool.handleGenerateCertificate', error)
      setCertificateMessage(
        error instanceof Error ? `Unable to load certificate: ${error.message}` : 'Unable to load certificate.',
      )
    } finally {
      setCertificateLoadingState(enrollmentId, false)
    }
  }

  const handleEnrollAction = (
    courseId: string,
    options?: {
      enrollmentId?: string
      isCompleted?: boolean
      certificateUrl?: string
    },
  ) => {
    const course = courses.find((item) => item.id === courseId)
    if (!course) return

    const enrollment =
      (options?.enrollmentId && enrollmentRecords.find((record) => record.id === options.enrollmentId)) ||
      enrollmentRecords.find((record) => record.courseId === courseId)

    const enrollmentId = options?.enrollmentId ?? enrollment?.id
    const snapshot = deriveEnrollmentSnapshot(enrollment, course)
    const isCompleted = options?.isCompleted ?? snapshot.isCompleted
    const certificateUrl = options?.certificateUrl ?? enrollment?.certificateUrl

    if (course.status === 'completed' || isCompleted) {
      if (certificateUrl) {
        openCertificate(certificateUrl)
        return
      }
      if (enrollmentId) {
        void handleGenerateCertificate(enrollmentId)
        return
      }
      const row = progressRows.find((progress) => progress.course === course.title)
      if (row) setSelectedProgress(row)
      return
    }

    if (!enrollmentId && enrollment?.id) {
      router.push(`/(dashboard)/digital-school/courses/${enrollment.courseId}`)
      return
    }

    if (!enrollmentId) {
      void (async () => {
        try {
          const created = await requestJson<ApiEnrollmentResponse>('/api/digital-school/enrollments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId }),
          })
          await loadEnrollments()
          router.push(`/(dashboard)/digital-school/courses/${created.courseId}`)
        } catch (error) {
          console.error('DigitalSchool.handleEnrollAction', error)
          setToast({
            message: error instanceof Error ? `Unable to start course: ${error.message}` : 'Unable to start course.',
            tone: 'error',
          })
        }
      })()
      return
    }

    router.push(`/(dashboard)/digital-school/courses/${courseId}`)
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

  const latestDraftId = draftCourses[0]?.id ?? null

  const markExamScore = (member: string, score: string) => {
    setProgressRows((prev) =>
      prev.map((row) => (row.member === member ? { ...row, examScore: score } : row)),
    )
    setSelectedProgress((prev) => (prev && prev.member === member ? { ...prev, examScore: score } : prev))
  }

  return (
    <>
      {builderModal}
      {isCourseManager ? (
        !isBuilderOpen && (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 py-12 text-center">
            <div className="max-w-md space-y-4">
              <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Digital School</p>
              <h1 className="text-3xl font-semibold text-gray-900">Course creation workspace</h1>
              <p className="text-sm text-gray-600">
                Launch the builder modal to create new discipleship tracks or resume an existing draft.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleOpenNewCourse}
                  className="px-4 py-2 rounded-full bg-primary-600 text-white text-sm font-semibold shadow hover:bg-primary-700"
                >
                  Open course builder
                </button>
                {latestDraftId && (
                  <button
                    type="button"
                    onClick={() => void handleResumeDraft(latestDraftId)}
                    disabled={resumingCourseId === latestDraftId}
                    className="px-4 py-2 rounded-full border text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {resumingCourseId === latestDraftId ? 'Loading draft…' : 'Resume latest draft'}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Closing the modal returns you to this launcher so you can reopen it whenever you need to edit courses.
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
          <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow">
            <h2 className="text-lg font-semibold text-gray-900">Access restricted</h2>
            <p className="text-sm text-gray-600 mt-2">You need an administrator role to manage Digital School courses.</p>
          </div>
        </div>
      )}
    </>
  )
}
