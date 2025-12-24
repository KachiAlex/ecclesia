
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  DigitalCourseExamService,
  DigitalCourseService,
  DigitalExamAttemptService,
} from '@/lib/services/digital-school-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

const isManager = (role?: UserRole) => !!role && MANAGER_ROLES.includes(role)

type RouteParams = {
  params: {
    attemptId: string
  }
}

async function loadAttempt(attemptId: string) {
  const attempt = await DigitalExamAttemptService.get(attemptId)
  if (!attempt) return { attempt: null, exam: null, course: null }
  const exam = await DigitalCourseExamService.get(attempt.examId)
  if (!exam) return { attempt: null, exam: null, course: null }
  const course = await DigitalCourseService.get(exam.courseId)
  if (!course) return { attempt: null, exam: null, course: null }
  return { attempt, exam, course }
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const scoped = await loadAttempt(params.attemptId)
    if (!scoped.attempt || scoped.course?.churchId !== guarded.ctx.church?.id) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (scoped.attempt.userId !== guarded.ctx.userId && !isManager(guarded.ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    return NextResponse.json(scoped.attempt)
  } catch (error: any) {
    console.error('DigitalSchool.attempt.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load attempt' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const scoped = await loadAttempt(params.attemptId)
    if (!scoped.attempt || scoped.course?.churchId !== guarded.ctx.church?.id) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (scoped.attempt.userId !== guarded.ctx.userId && !isManager(guarded.ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    if (scoped.attempt.status !== 'in_progress') {
      return NextResponse.json({ error: 'Attempt already submitted' }, { status: 400 })
    }

    const { responses } = (await request.json()) as {
      responses?: Array<{ questionId: string; answerIndex: number }>
    }

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json({ error: 'responses array is required' }, { status: 400 })
    }

    const updated = await DigitalExamAttemptService.submit(params.attemptId, responses)
    if (!updated) {
      return NextResponse.json({ error: 'Unable to submit attempt' }, { status: 400 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('DigitalSchool.attempt.PUT', error)
    return NextResponse.json({ error: error.message || 'Failed to submit attempt' }, { status: 500 })
  }
}
