
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

export async function GET(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')

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
      return NextResponse.json(attempts)
    }

    const attempts = await DigitalExamAttemptService.listByUser(guarded.ctx.userId)
    return NextResponse.json(attempts)
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
