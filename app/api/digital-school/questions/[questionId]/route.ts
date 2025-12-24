
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  DigitalCourseExamService,
  DigitalCourseService,
  DigitalExamQuestionService,
} from '@/lib/services/digital-school-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

type RouteParams = {
  params: {
    questionId: string
  }
}

async function scopeQuestion(questionId: string, churchId?: string) {
  const question = await DigitalExamQuestionService.get(questionId)
  if (!question) return { question: null, course: null, exam: null }
  const exam = await DigitalCourseExamService.get(question.examId)
  if (!exam) return { question: null, course: null, exam: null }
  const course = await DigitalCourseService.get(exam.courseId)
  if (!course || course.churchId !== churchId) return { question: null, course: null, exam: null }
  return { question, exam, course }
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const scoped = await scopeQuestion(params.questionId, guarded.ctx.church?.id)
    if (!scoped.question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json(scoped.question)
  } catch (error: any) {
    console.error('DigitalSchool.question.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load question' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const scoped = await scopeQuestion(params.questionId, guarded.ctx.church?.id)
    if (!scoped.question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const body = await request.json()
    const updated = await DigitalExamQuestionService.update(params.questionId, body)
    if (!updated) {
      return NextResponse.json({ error: 'Unable to update question' }, { status: 400 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('DigitalSchool.question.PUT', error)
    return NextResponse.json({ error: error.message || 'Failed to update question' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const scoped = await scopeQuestion(params.questionId, guarded.ctx.church?.id)
    if (!scoped.question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    await DigitalExamQuestionService.delete(params.questionId)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('DigitalSchool.question.DELETE', error)
    return NextResponse.json({ error: error.message || 'Failed to delete question' }, { status: 500 })
  }
}
