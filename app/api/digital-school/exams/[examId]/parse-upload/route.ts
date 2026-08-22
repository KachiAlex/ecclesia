export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  DigitalCourseExamService,
  DigitalCourseService,
  DigitalExamQuestionService,
} from '@/lib/services/digital-school-service'
import { parseExamUpload } from '@/lib/digital-school/exam-upload-parser'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

type RouteParams = {
  params: { examId: string }
}

type ParseUploadPayload = {
  fileUrl?: string
  originalName?: string
  replaceExisting?: boolean
}

async function scopeExam(examId: string, churchId?: string) {
  const exam = await DigitalCourseExamService.get(examId)
  if (!exam) return { exam: null, course: null }
  const course = await DigitalCourseService.get(exam.courseId)
  if (!course || course.churchId !== churchId) return { exam: null, course: null }
  return { exam, course }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const { exam, course } = await scopeExam(params.examId, guarded.ctx.church?.id)
    if (!exam || !course) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const payload = (await request.json().catch(() => null)) as ParseUploadPayload | null
    if (!payload?.fileUrl) {
      return NextResponse.json({ error: 'fileUrl is required' }, { status: 400 })
    }

    const response = await fetch(payload.fileUrl)
    if (!response.ok) {
      return NextResponse.json({ error: 'Unable to download uploaded file for parsing' }, { status: 400 })
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const parseSummary = parseExamUpload(buffer, { fileName: payload.originalName })

    const createdQuestionIds: string[] = []
    const errors: string[] = []

    if (payload.replaceExisting) {
      const existing = await DigitalExamQuestionService.listByExam(exam.id)
      for (const question of existing) {
        await DigitalExamQuestionService.delete(question.id)
      }
    }

    for (const question of parseSummary.parsed) {
      try {
        const created = await DigitalExamQuestionService.create({
          examId: exam.id,
          courseId: exam.courseId,
          moduleId: exam.moduleId,
          question: question.question,
          options: question.options,
          correctOption: question.correctOption,
          explanation: question.explanation,
          weight: question.weight,
          durationSeconds: question.durationSeconds,
        })
        createdQuestionIds.push(created.id)
      } catch (error: any) {
        errors.push(error?.message || 'Failed to create question')
      }
    }

    return NextResponse.json({
      summary: {
        totalRows: parseSummary.totalRows,
        createdCount: createdQuestionIds.length,
        skipped: parseSummary.skipped,
        warnings: [...parseSummary.warnings, ...errors.map((message) => `Create error: ${message}`)],
      },
    })
  } catch (error: any) {
    console.error('DigitalSchool.exam.parse-upload.POST', error)
    return NextResponse.json({ error: error.message || 'Failed to parse exam upload' }, { status: 500 })
  }
}
