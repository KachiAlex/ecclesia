
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  DigitalCourseExamService,
  DigitalCourseService,
  DigitalExamQuestionInput,
  DigitalExamQuestionService,
} from '@/lib/services/digital-school-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

export async function GET(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')
    if (!examId) {
      return NextResponse.json({ error: 'examId is required' }, { status: 400 })
    }

    const exam = await DigitalCourseExamService.get(examId)
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const course = await DigitalCourseService.get(exam.courseId)
    if (!course || course.churchId !== guarded.ctx.church?.id) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const questions = await DigitalExamQuestionService.listByExam(examId)
    return NextResponse.json(questions)
  } catch (error: any) {
    console.error('DigitalSchool.questions.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load questions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const body = (await request.json()) as Partial<DigitalExamQuestionInput>
    if (!body.examId || !body.courseId || !body.question || !body.options || typeof body.correctOption !== 'number') {
      return NextResponse.json({ error: 'examId, courseId, question, options, and correctOption are required' }, { status: 400 })
    }

    const exam = await DigitalCourseExamService.get(body.examId)
    if (!exam || exam.courseId !== body.courseId) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const course = await DigitalCourseService.get(exam.courseId)
    if (!course || course.churchId !== guarded.ctx.church?.id) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const question = await DigitalExamQuestionService.create({
      examId: body.examId,
      courseId: body.courseId,
      moduleId: body.moduleId,
      question: body.question,
      options: body.options,
      correctOption: body.correctOption,
      explanation: body.explanation,
      weight: body.weight,
      durationSeconds: body.durationSeconds,
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error: any) {
    console.error('DigitalSchool.questions.POST', error)
    return NextResponse.json({ error: error.message || 'Failed to create question' }, { status: 500 })
  }
}
