
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  DigitalCourseEnrollmentService,
  DigitalCourseExamService,
  DigitalCourseService,
  DigitalExamAttemptService,
  DigitalExamQuestionService,
} from '@/lib/services/digital-school-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

const isManager = (role?: UserRole) => !!role && MANAGER_ROLES.includes(role)

export async function GET(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')
    const userIdParam = searchParams.get('userId')
    const courseIdParam = searchParams.get('courseId')

    const hydrateAttempts = async (
      attempts: Awaited<ReturnType<typeof DigitalExamAttemptService.listByExam>>,
      includeQuestionSummaries = false,
    ) => {
      if (!attempts.length) return attempts
      const uniqueExamIds = Array.from(new Set(attempts.map((attempt) => attempt.examId)))
      const exams = await Promise.all(uniqueExamIds.map(async (id) => DigitalCourseExamService.get(id)))
      const examMap = new Map(
        exams.filter((exam): exam is NonNullable<typeof exam> => Boolean(exam)).map((exam) => [exam.id, exam]),
      )

      let questionSummaryMap: Map<
        string,
        Array<{ id: string; question: string; options: string[]; correctOption: number }>
      > | null = null
      if (includeQuestionSummaries) {
        questionSummaryMap = new Map()
        for (const examId of uniqueExamIds) {
          const questions = await DigitalExamQuestionService.listByExam(examId)
          questionSummaryMap.set(
            examId,
            questions.map((question) => ({
              id: question.id,
              question: question.question,
              options: question.options,
              correctOption: question.correctOption,
            })),
          )
        }
      }

      return attempts.map((attempt) => ({
        ...attempt,
        examMeta: examMap.get(attempt.examId)
          ? {
              id: examMap.get(attempt.examId)!.id,
              title: examMap.get(attempt.examId)!.title,
              sectionId: examMap.get(attempt.examId)!.sectionId,
            }
          : null,
        questionSummaries: questionSummaryMap?.get(attempt.examId),
      }))
    }

    if (examId) {
      if (!isManager(guarded.ctx.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      const exam = await DigitalCourseExamService.get(examId)
      if (!exam) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
      }

      const course = await DigitalCourseService.get(exam.courseId)
      if (!course || course.churchId !== guarded.ctx.church?.id) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
      }

      const attempts = await DigitalExamAttemptService.listByExam(examId)
      return NextResponse.json(await hydrateAttempts(attempts))
    }

    if (userIdParam) {
      if (!isManager(guarded.ctx.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      let course: Awaited<ReturnType<typeof DigitalCourseService.get>> | null = null
      if (courseIdParam) {
        course = await DigitalCourseService.get(courseIdParam)
        if (!course || course.churchId !== guarded.ctx.church?.id) {
          return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }
      }

      const attempts = await DigitalExamAttemptService.listByUser(userIdParam)
      const filtered = course ? attempts.filter((attempt) => attempt.courseId === course!.id) : attempts
      return NextResponse.json(await hydrateAttempts(filtered))
    }

    const includeQuestionSummaries = new URL(request.url).searchParams.get('includeQuestionSummaries') === '1'
    const attempts = await DigitalExamAttemptService.listByUser(guarded.ctx.userId)
    return NextResponse.json(await hydrateAttempts(attempts, includeQuestionSummaries))
  } catch (error: any) {
    console.error('DigitalSchool.attempts.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load attempts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { examId } = (await request.json()) as { examId?: string }
    if (!examId) {
      return NextResponse.json({ error: 'examId is required' }, { status: 400 })
    }

    const exam = await DigitalCourseExamService.get(examId)
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const course = await DigitalCourseService.get(exam.courseId)
    if (!course || course.churchId !== guarded.ctx.church?.id) {
      return NextResponse.json({ error: 'Exam not available' }, { status: 404 })
    }

    const enrollment =
      (await DigitalCourseEnrollmentService.findByUserAndCourse(guarded.ctx.userId, course.id)) ??
      (await DigitalCourseEnrollmentService.enroll({
        courseId: course.id,
        churchId: guarded.ctx.church!.id,
        userId: guarded.ctx.userId,
      }))

    if (enrollment && (enrollment.progressPercent ?? 0) < 80) {
      await DigitalCourseEnrollmentService.updateProgress(enrollment.id, 80, undefined, enrollment.status)
    }

    const shouldEnforceRetakePolicy =
      typeof exam.retakePolicy?.maxAttempts === 'number' || typeof exam.retakePolicy?.cooldownHours === 'number'

    if (shouldEnforceRetakePolicy) {
      const userAttempts = await DigitalExamAttemptService.listByUser(guarded.ctx.userId)
      const examAttempts = userAttempts.filter((attempt) => attempt.examId === examId)

      const activeAttempt = examAttempts.find((attempt) => attempt.status === 'in_progress')
      if (activeAttempt) {
        return NextResponse.json(
          { error: 'You already have an in-progress attempt. Please submit it before starting a new one.' },
          { status: 409 },
        )
      }

      const maxAttempts = exam.retakePolicy?.maxAttempts
      if (typeof maxAttempts === 'number' && maxAttempts > 0 && examAttempts.length >= maxAttempts) {
        return NextResponse.json(
          {
            error: `You have reached the maximum of ${maxAttempts} attempt${maxAttempts === 1 ? '' : 's'} configured by your admin.`,
          },
          { status: 429 },
        )
      }

      const cooldownHours = exam.retakePolicy?.cooldownHours
      if (typeof cooldownHours === 'number' && cooldownHours > 0 && examAttempts.length > 0) {
        const latestAttempt = examAttempts[0]
        const anchorDate = latestAttempt.submittedAt ?? latestAttempt.startedAt
        if (anchorDate) {
          const availableAt = new Date(anchorDate.getTime() + cooldownHours * 60 * 60 * 1000)
          if (Date.now() < availableAt.getTime()) {
            return NextResponse.json(
              {
                error: `Please wait ${cooldownHours} hour${cooldownHours === 1 ? '' : 's'} before attempting again.`,
                retryAt: availableAt.toISOString(),
              },
              { status: 429 },
            )
          }
        }
      }
    }

    const attempt = await DigitalExamAttemptService.start({
      examId,
      courseId: exam.courseId,
      userId: guarded.ctx.userId,
    })

    return NextResponse.json(attempt, { status: 201 })
  } catch (error: any) {
    console.error('DigitalSchool.attempts.POST', error)
    return NextResponse.json({ error: error.message || 'Failed to start attempt' }, { status: 500 })
  }
}
