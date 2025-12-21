import { FieldValue } from 'firebase-admin/firestore'
import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export type DigitalCourseAccess = 'open' | 'request' | 'invite'
export type DigitalCourseStatus = 'draft' | 'published' | 'archived'
export type DigitalCourseEnrollmentStatus = 'active' | 'completed' | 'withdrawn'
export type DigitalExamStatus = 'draft' | 'published' | 'archived'
export type DigitalExamAttemptStatus = 'in_progress' | 'submitted' | 'graded'

export interface DigitalCourse {
  id: string
  churchId: string
  title: string
  summary?: string
  accessType: DigitalCourseAccess
  mentors: string[]
  estimatedHours?: number
  coverImageUrl?: string
  tags?: string[]
  status: DigitalCourseStatus
  createdBy: string
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

export interface DigitalCourseInput {
  churchId: string
  title: string
  summary?: string
  accessType?: DigitalCourseAccess
  mentors?: string[]
  estimatedHours?: number
  coverImageUrl?: string
  tags?: string[]
  status?: DigitalCourseStatus
  createdBy: string
  updatedBy?: string
}

export interface DigitalCourseModule {
  id: string
  courseId: string
  title: string
  description?: string
  order: number
  estimatedMinutes?: number
  createdAt: Date
  updatedAt: Date
}

export interface DigitalCourseModuleInput {
  courseId: string
  title: string
  description?: string
  order?: number
  estimatedMinutes?: number
}

export interface DigitalCourseLesson {
  id: string
  courseId: string
  moduleId: string
  title: string
  description?: string
  videoUrl?: string
  audioUrl?: string
  attachmentUrls?: string[]
  transcript?: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface DigitalCourseLessonInput {
  courseId: string
  moduleId: string
  title: string
  description?: string
  videoUrl?: string
  audioUrl?: string
  attachmentUrls?: string[]
  transcript?: string
  order?: number
}

export type AccessRequestStatus = 'pending' | 'approved' | 'declined' | 'more_info'

export interface DigitalCourseAccessRequest {
  id: string
  courseId: string
  userId: string
  reason?: string
  status: AccessRequestStatus
  reviewerId?: string
  reviewerNote?: string
  createdAt: Date
  updatedAt: Date
}

export interface DigitalCourseAccessRequestInput {
  courseId: string
  userId: string
  reason?: string
}

export interface DigitalCourseEnrollment {
  id: string
  courseId: string
  userId: string
  churchId: string
  status: DigitalCourseEnrollmentStatus
  progressPercent: number
  moduleProgress: Record<string, number>
  badgeIssuedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface DigitalCourseEnrollmentInput {
  courseId: string
  churchId: string
  userId: string
}

export interface DigitalCourseExam {
  id: string
  courseId: string
  moduleId?: string
  title: string
  description?: string
  timeLimitMinutes?: number
  questionCount: number
  status: DigitalExamStatus
  uploadMetadata?: {
    source?: string
    originalFileName?: string
  }
  createdBy: string
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

export interface DigitalCourseExamInput {
  courseId: string
  moduleId?: string
  title: string
  description?: string
  timeLimitMinutes?: number
  status?: DigitalExamStatus
  uploadMetadata?: {
    source?: string
    originalFileName?: string
  }
  createdBy: string
  updatedBy?: string
}

export interface DigitalExamQuestion {
  id: string
  examId: string
  courseId: string
  moduleId?: string
  question: string
  options: string[]
  correctOption: number
  explanation?: string
  weight?: number
  durationSeconds?: number
  createdAt: Date
  updatedAt: Date
}

export interface DigitalExamQuestionInput {
  examId: string
  courseId: string
  moduleId?: string
  question: string
  options: string[]
  correctOption: number
  explanation?: string
  weight?: number
  durationSeconds?: number
}

export interface DigitalExamAttempt {
  id: string
  examId: string
  courseId: string
  userId: string
  status: DigitalExamAttemptStatus
  score?: number
  totalQuestions?: number
  startedAt: Date
  submittedAt?: Date
  responses: Array<{
    questionId: string
    answerIndex: number
    correct: boolean
  }>
  createdAt: Date
  updatedAt: Date
}

export interface DigitalExamAttemptInput {
  examId: string
  courseId: string
  userId: string
}

const serverTimestamps = () => ({
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
})

const omitUndefined = <T extends Record<string, any>>(data: T) =>
  Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined))

function buildDocWithTimestamps<T extends Record<string, any>>(data: T, userId?: string) {
  return {
    ...data,
    updatedBy: userId ?? data.updatedBy ?? data.createdBy,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }
}

export class DigitalCourseEnrollmentService {
  static collection() {
    return db.collection(COLLECTIONS.digitalCourseEnrollments)
  }

  static async get(enrollmentId: string): Promise<DigitalCourseEnrollment | null> {
    const doc = await this.collection().doc(enrollmentId).get()
    if (!doc.exists) return null
    return this.fromDoc(doc.id, doc.data()!)
  }

  static async enroll(input: DigitalCourseEnrollmentInput): Promise<DigitalCourseEnrollment> {
    const docRef = this.collection().doc()
    const payload = {
      courseId: input.courseId,
      churchId: input.churchId,
      userId: input.userId,
      status: 'active' as DigitalCourseEnrollmentStatus,
      progressPercent: 0,
      moduleProgress: {},
      ...serverTimestamps(),
    }
    await docRef.set(payload)
    const created = await docRef.get()
    return this.fromDoc(created.id, created.data()!)
  }

  static async listByCourse(courseId: string): Promise<DigitalCourseEnrollment[]> {
    const snapshot = await this.collection().where('courseId', '==', courseId).get()
    return snapshot.docs.map((doc) => this.fromDoc(doc.id, doc.data()))
  }

  static async listByUser(userId: string): Promise<DigitalCourseEnrollment[]> {
    const snapshot = await this.collection().where('userId', '==', userId).get()
    return snapshot.docs.map((doc) => this.fromDoc(doc.id, doc.data()))
  }

  static async updateProgress(
    enrollmentId: string,
    progressPercent?: number,
    moduleProgress?: Record<string, number>,
    status?: DigitalCourseEnrollmentStatus,
    badgeIssuedAt?: Date,
  ): Promise<DigitalCourseEnrollment | null> {
    const docRef = this.collection().doc(enrollmentId)
    const existing = await docRef.get()
    if (!existing.exists) return null

    const updatePayload: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (typeof progressPercent === 'number') updatePayload.progressPercent = progressPercent
    if (moduleProgress) updatePayload.moduleProgress = moduleProgress
    if (status) updatePayload.status = status
    if (badgeIssuedAt) updatePayload.badgeIssuedAt = badgeIssuedAt

    await docRef.update(updatePayload)
    const updated = await docRef.get()
    return this.fromDoc(updated.id, updated.data()!)
  }

  private static fromDoc(id: string, data: Record<string, any>): DigitalCourseEnrollment {
    return {
      id,
      courseId: data.courseId,
      churchId: data.churchId,
      userId: data.userId,
      status: data.status,
      progressPercent: data.progressPercent ?? 0,
      moduleProgress: data.moduleProgress || {},
      badgeIssuedAt: data.badgeIssuedAt ? toDate(data.badgeIssuedAt) : undefined,
      createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
    }
  }
}

export class DigitalCourseExamService {
  static collection() {
    return db.collection(COLLECTIONS.digitalCourseExams)
  }

  static async listByCourse(courseId: string): Promise<DigitalCourseExam[]> {
    const snapshot = await this.collection().where('courseId', '==', courseId).orderBy('createdAt', 'desc').get()
    return snapshot.docs.map((doc) => this.fromDoc(doc.id, doc.data()))
  }

  static async get(examId: string): Promise<DigitalCourseExam | null> {
    const doc = await this.collection().doc(examId).get()
    if (!doc.exists) return null
    return this.fromDoc(doc.id, doc.data()!)
  }

  static async create(input: DigitalCourseExamInput): Promise<DigitalCourseExam> {
    const docRef = this.collection().doc()
    const payload = {
      courseId: input.courseId,
      moduleId: input.moduleId ?? null,
      title: input.title,
      description: input.description ?? '',
      timeLimitMinutes: input.timeLimitMinutes ?? null,
      questionCount: 0,
      status: input.status ?? 'draft',
      uploadMetadata: input.uploadMetadata ?? null,
      createdBy: input.createdBy,
      updatedBy: input.updatedBy ?? input.createdBy,
      ...serverTimestamps(),
    }

    await docRef.set(payload)
    const created = await docRef.get()
    return this.fromDoc(created.id, created.data()!)
  }

  static async update(
    examId: string,
    data: Partial<Omit<DigitalCourseExamInput, 'courseId'>>,
  ): Promise<DigitalCourseExam | null> {
    const docRef = this.collection().doc(examId)
    const existing = await docRef.get()
    if (!existing.exists) return null

    await docRef.update({
      ...omitUndefined(data),
      updatedBy: data.updatedBy ?? existing.data()?.updatedBy,
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updated = await docRef.get()
    return this.fromDoc(updated.id, updated.data()!)
  }

  static async delete(examId: string): Promise<void> {
    await this.collection().doc(examId).delete()
  }

  static async incrementQuestionCount(examId: string, delta: number) {
    await this.collection().doc(examId).update({
      questionCount: FieldValue.increment(delta),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  private static fromDoc(id: string, data: Record<string, any>): DigitalCourseExam {
    return {
      id,
      courseId: data.courseId,
      moduleId: data.moduleId || undefined,
      title: data.title,
      description: data.description || undefined,
      timeLimitMinutes: data.timeLimitMinutes ?? undefined,
      questionCount: data.questionCount || 0,
      status: data.status ?? 'draft',
      uploadMetadata: data.uploadMetadata || undefined,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
    }
  }
}

export class DigitalExamQuestionService {
  static collection() {
    return db.collection(COLLECTIONS.digitalExamQuestions)
  }

  static async get(questionId: string): Promise<DigitalExamQuestion | null> {
    const doc = await this.collection().doc(questionId).get()
    if (!doc.exists) return null
    return this.fromDoc(doc.id, doc.data()!)
  }

  static async listByExam(examId: string): Promise<DigitalExamQuestion[]> {
    const snapshot = await this.collection().where('examId', '==', examId).get()
    return snapshot.docs.map((doc) => this.fromDoc(doc.id, doc.data()))
  }

  static async create(input: DigitalExamQuestionInput): Promise<DigitalExamQuestion> {
    const docRef = this.collection().doc()
    const payload = {
      examId: input.examId,
      courseId: input.courseId,
      moduleId: input.moduleId ?? null,
      question: input.question,
      options: input.options,
      correctOption: input.correctOption,
      explanation: input.explanation ?? '',
      weight: input.weight ?? 1,
      durationSeconds: input.durationSeconds ?? null,
      ...serverTimestamps(),
    }

    await docRef.set(payload)
    await DigitalCourseExamService.incrementQuestionCount(input.examId, 1)
    const created = await docRef.get()
    return this.fromDoc(created.id, created.data()!)
  }

  static async update(
    questionId: string,
    data: Partial<Omit<DigitalExamQuestionInput, 'examId' | 'courseId'>>,
  ): Promise<DigitalExamQuestion | null> {
    const docRef = this.collection().doc(questionId)
    const existing = await docRef.get()
    if (!existing.exists) return null

    await docRef.update({
      ...omitUndefined(data),
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updated = await docRef.get()
    return this.fromDoc(updated.id, updated.data()!)
  }

  static async delete(questionId: string): Promise<boolean> {
    const docRef = this.collection().doc(questionId)
    const existing = await docRef.get()
    if (!existing.exists) return false

    const data = existing.data()!
    await docRef.delete()
    if (data.examId) {
      await DigitalCourseExamService.incrementQuestionCount(data.examId as string, -1)
    }
    return true
  }

  private static fromDoc(id: string, data: Record<string, any>): DigitalExamQuestion {
    return {
      id,
      examId: data.examId,
      courseId: data.courseId,
      moduleId: data.moduleId || undefined,
      question: data.question,
      options: data.options || [],
      correctOption: data.correctOption,
      explanation: data.explanation || undefined,
      weight: data.weight ?? 1,
      durationSeconds: data.durationSeconds ?? undefined,
      createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
    }
  }
}

export class DigitalExamAttemptService {
  static collection() {
    return db.collection(COLLECTIONS.digitalExamAttempts)
  }

  static async get(attemptId: string): Promise<DigitalExamAttempt | null> {
    const doc = await this.collection().doc(attemptId).get()
    if (!doc.exists) return null
    return this.fromDoc(doc.id, doc.data()!)
  }

  static async listByExam(examId: string): Promise<DigitalExamAttempt[]> {
    const snapshot = await this.collection().where('examId', '==', examId).orderBy('createdAt', 'desc').get()
    return snapshot.docs.map((doc) => this.fromDoc(doc.id, doc.data()))
  }

  static async listByUser(userId: string): Promise<DigitalExamAttempt[]> {
    const snapshot = await this.collection().where('userId', '==', userId).orderBy('createdAt', 'desc').get()
    return snapshot.docs.map((doc) => this.fromDoc(doc.id, doc.data()))
  }

  static async start(input: DigitalExamAttemptInput): Promise<DigitalExamAttempt> {
    const docRef = this.collection().doc()
    const payload = {
      examId: input.examId,
      courseId: input.courseId,
      userId: input.userId,
      status: 'in_progress' as DigitalExamAttemptStatus,
      score: null,
      totalQuestions: null,
      startedAt: FieldValue.serverTimestamp(),
      submittedAt: null,
      responses: [],
      ...serverTimestamps(),
    }
    await docRef.set(payload)
    const created = await docRef.get()
    return this.fromDoc(created.id, created.data()!)
  }

  static async submit(
    attemptId: string,
    responses: Array<{ questionId: string; answerIndex: number }>,
  ): Promise<DigitalExamAttempt | null> {
    const docRef = this.collection().doc(attemptId)
    const existing = await docRef.get()
    if (!existing.exists) return null

    const data = existing.data()!
    const examId = data.examId as string
    const questions = await DigitalExamQuestionService.listByExam(examId)

    const gradedResponses = responses.map((response) => {
      const question = questions.find((q) => q.id === response.questionId)
      const correct = question ? question.correctOption === response.answerIndex : false
      return {
        questionId: response.questionId,
        answerIndex: response.answerIndex,
        correct,
      }
    })

    const totalQuestions = questions.length
    const correctCount = gradedResponses.filter((r) => r.correct).length
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

    await docRef.update({
      status: 'submitted',
      score,
      totalQuestions,
      responses: gradedResponses,
      submittedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updated = await docRef.get()
    return this.fromDoc(updated.id, updated.data()!)
  }

  private static fromDoc(id: string, data: Record<string, any>): DigitalExamAttempt {
    return {
      id,
      examId: data.examId,
      courseId: data.courseId,
      userId: data.userId,
      status: data.status,
      score: typeof data.score === 'number' ? data.score : undefined,
      totalQuestions: typeof data.totalQuestions === 'number' ? data.totalQuestions : undefined,
      startedAt: data.startedAt ? toDate(data.startedAt) : new Date(),
      submittedAt: data.submittedAt ? toDate(data.submittedAt) : undefined,
      responses: data.responses || [],
      createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
    }
  }
}

export class DigitalCourseService {
  static collection() {
    return db.collection(COLLECTIONS.digitalCourses)
  }

  static async list(churchId: string, limit: number = 50): Promise<DigitalCourse[]> {
    const snapshot = await this.collection()
      .where('churchId', '==', churchId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    return snapshot.docs.map((doc) => this.fromDoc(doc.id, doc.data()))
  }

  static async get(courseId: string): Promise<DigitalCourse | null> {
    const doc = await this.collection().doc(courseId).get()
    if (!doc.exists) return null
    return this.fromDoc(doc.id, doc.data()!)
  }

  static async create(input: DigitalCourseInput): Promise<DigitalCourse> {
    const docRef = this.collection().doc()
    const payload = buildDocWithTimestamps({
      churchId: input.churchId,
      title: input.title,
      summary: input.summary ?? '',
      accessType: input.accessType ?? 'open',
      mentors: input.mentors ?? [],
      estimatedHours: input.estimatedHours ?? null,
      coverImageUrl: input.coverImageUrl ?? null,
      tags: input.tags ?? [],
      status: input.status ?? 'draft',
      createdBy: input.createdBy,
      updatedBy: input.updatedBy ?? input.createdBy,
    })

    await docRef.set(payload)
    const created = await docRef.get()
    return this.fromDoc(created.id, created.data()!)
  }

  static async update(courseId: string, data: Partial<DigitalCourseInput>): Promise<DigitalCourse | null> {
    const docRef = this.collection().doc(courseId)
    const existing = await docRef.get()
    if (!existing.exists) return null

    const updateData = {
      ...data,
      updatedBy: data.updatedBy ?? data.createdBy ?? existing.data()?.updatedBy,
      updatedAt: FieldValue.serverTimestamp(),
    }

    await docRef.update(updateData)
    const updated = await docRef.get()
    return this.fromDoc(updated.id, updated.data()!)
  }

  static async delete(courseId: string): Promise<void> {
    await this.collection().doc(courseId).delete()
  }

  private static fromDoc(id: string, data: Record<string, any>): DigitalCourse {
    return {
      id,
      churchId: data.churchId,
      title: data.title,
      summary: data.summary || undefined,
      accessType: data.accessType,
      mentors: data.mentors || [],
      estimatedHours: data.estimatedHours ?? undefined,
      coverImageUrl: data.coverImageUrl || undefined,
      tags: data.tags || [],
      status: data.status ?? 'draft',
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
    }
  }
}

export class DigitalCourseModuleService {
  static collection() {
    return db.collection(COLLECTIONS.digitalCourseModules)
  }

  static async listByCourse(courseId: string): Promise<DigitalCourseModule[]> {
    const snapshot = await this.collection().where('courseId', '==', courseId).orderBy('order', 'asc').get()
    return snapshot.docs.map((doc) => this.fromDoc(doc.id, doc.data()))
  }

  static async get(moduleId: string): Promise<DigitalCourseModule | null> {
    const doc = await this.collection().doc(moduleId).get()
    if (!doc.exists) return null
    return this.fromDoc(doc.id, doc.data()!)
  }

  static async create(input: DigitalCourseModuleInput): Promise<DigitalCourseModule> {
    const docRef = this.collection().doc()
    const existingCount = await this.collection().where('courseId', '==', input.courseId).get()
    const payload = {
      courseId: input.courseId,
      title: input.title,
      description: input.description ?? '',
      order: input.order ?? existingCount.size + 1,
      estimatedMinutes: input.estimatedMinutes ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    await docRef.set(payload)
    const created = await docRef.get()
    return this.fromDoc(created.id, created.data()!)
  }

  static async update(
    moduleId: string,
    data: Partial<Omit<DigitalCourseModuleInput, 'courseId'>>,
  ): Promise<DigitalCourseModule | null> {
    const docRef = this.collection().doc(moduleId)
    const existing = await docRef.get()
    if (!existing.exists) return null

    await docRef.update({
      ...omitUndefined(data),
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updated = await docRef.get()
    return this.fromDoc(updated.id, updated.data()!)
  }

  static async delete(moduleId: string): Promise<void> {
    await this.collection().doc(moduleId).delete()
  }

  private static fromDoc(id: string, data: Record<string, any>): DigitalCourseModule {
    return {
      id,
      courseId: data.courseId,
      title: data.title,
      description: data.description || undefined,
      order: data.order,
      estimatedMinutes: data.estimatedMinutes ?? undefined,
      createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
    }
  }
}

export class DigitalCourseLessonService {
  static collection() {
    return db.collection(COLLECTIONS.digitalCourseLessons)
  }

  static async listByModule(moduleId: string): Promise<DigitalCourseLesson[]> {
    const snapshot = await this.collection().where('moduleId', '==', moduleId).orderBy('order', 'asc').get()
    return snapshot.docs.map((doc) => this.fromDoc(doc.id, doc.data()))
  }

  static async get(lessonId: string): Promise<DigitalCourseLesson | null> {
    const doc = await this.collection().doc(lessonId).get()
    if (!doc.exists) return null
    return this.fromDoc(doc.id, doc.data()!)
  }

  static async create(input: DigitalCourseLessonInput): Promise<DigitalCourseLesson> {
    const docRef = this.collection().doc()
    const existingCount = await this.collection().where('moduleId', '==', input.moduleId).get()
    const payload = {
      courseId: input.courseId,
      moduleId: input.moduleId,
      title: input.title,
      description: input.description ?? '',
      videoUrl: input.videoUrl ?? null,
      audioUrl: input.audioUrl ?? null,
      attachmentUrls: input.attachmentUrls ?? [],
      transcript: input.transcript ?? '',
      order: input.order ?? existingCount.size + 1,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    await docRef.set(payload)
    const created = await docRef.get()
    return this.fromDoc(created.id, created.data()!)
  }

  static async update(
    lessonId: string,
    data: Partial<Omit<DigitalCourseLessonInput, 'courseId'>>,
  ): Promise<DigitalCourseLesson | null> {
    const docRef = this.collection().doc(lessonId)
    const existing = await docRef.get()
    if (!existing.exists) return null

    await docRef.update({
      ...omitUndefined(data),
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updated = await docRef.get()
    return this.fromDoc(updated.id, updated.data()!)
  }

  static async delete(lessonId: string): Promise<void> {
    await this.collection().doc(lessonId).delete()
  }

  private static fromDoc(id: string, data: Record<string, any>): DigitalCourseLesson {
    return {
      id,
      courseId: data.courseId,
      moduleId: data.moduleId,
      title: data.title,
      description: data.description || undefined,
      videoUrl: data.videoUrl || undefined,
      audioUrl: data.audioUrl || undefined,
      attachmentUrls: data.attachmentUrls || [],
      transcript: data.transcript || undefined,
      order: data.order,
      createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
    }
  }
}

export class DigitalCourseAccessRequestService {
  static collection() {
    return db.collection(COLLECTIONS.digitalCourseAccessRequests)
  }

  static async get(id: string): Promise<DigitalCourseAccessRequest | null> {
    const doc = await this.collection().doc(id).get()
    if (!doc.exists) return null
    return this.fromDoc(doc.id, doc.data()!)
  }

  static async listByCourse(
    courseId: string,
    status?: AccessRequestStatus,
  ): Promise<DigitalCourseAccessRequest[]> {
    let query = this.collection().where('courseId', '==', courseId)
    if (status) {
      query = query.where('status', '==', status)
    }
    const snapshot = await query.orderBy('createdAt', 'desc').get()
    return snapshot.docs.map((doc) => this.fromDoc(doc.id, doc.data()))
  }

  static async listPending(courseId: string): Promise<DigitalCourseAccessRequest[]> {
    return this.listByCourse(courseId, 'pending')
  }

  static async listByUser(userId: string): Promise<DigitalCourseAccessRequest[]> {
    const snapshot = await this.collection().where('userId', '==', userId).orderBy('createdAt', 'desc').get()
    return snapshot.docs.map((doc) => this.fromDoc(doc.id, doc.data()))
  }

  static async submit(input: DigitalCourseAccessRequestInput): Promise<DigitalCourseAccessRequest> {
    const docRef = this.collection().doc()
    const payload = {
      courseId: input.courseId,
      userId: input.userId,
      reason: input.reason ?? '',
      status: 'pending' as AccessRequestStatus,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    await docRef.set(payload)
    const created = await docRef.get()
    return this.fromDoc(created.id, created.data()!)
  }

  static async updateStatus(
    id: string,
    status: AccessRequestStatus,
    reviewerId: string,
    reviewerNote?: string,
  ): Promise<DigitalCourseAccessRequest | null> {
    const docRef = this.collection().doc(id)
    const existing = await docRef.get()
    if (!existing.exists) return null

    await docRef.update({
      status,
      reviewerId,
      reviewerNote: reviewerNote ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updated = await docRef.get()
    return this.fromDoc(updated.id, updated.data()!)
  }

  private static fromDoc(id: string, data: Record<string, any>): DigitalCourseAccessRequest {
    return {
      id,
      courseId: data.courseId,
      userId: data.userId,
      reason: data.reason || undefined,
      status: data.status,
      reviewerId: data.reviewerId || undefined,
      reviewerNote: data.reviewerNote || undefined,
      createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
    }
  }
}
