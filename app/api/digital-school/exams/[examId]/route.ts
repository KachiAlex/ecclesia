
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  DigitalCourseExamService,
  DigitalCourseModuleService,
  DigitalCourseSectionService,
  DigitalCourseService,
} from '@/lib/services/digital-school-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

type RouteParams = {
  params: {
    examId: string
  }
}

async function scopeExam(examId: string, churchId?: string) {
  const exam = await DigitalCourseExamService.get(examId)
  if (!exam) return { exam: null, course: null, section: null }
  const course = await DigitalCourseService.get(exam.courseId)
  if (!course || course.churchId !== churchId) return { exam: null, course: null, section: null }
  const section = await DigitalCourseSectionService.get(exam.sectionId)
  if (!section || section.courseId !== course.id) return { exam: null, course: null, section: null }
  return { exam, course, section }
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const scoped = await scopeExam(params.examId, guarded.ctx.church?.id)
    if (!scoped.exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    return NextResponse.json(scoped.exam)
  } catch (error: any) {
    console.error('DigitalSchool.exam.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load exam' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const scoped = await scopeExam(params.examId, guarded.ctx.church?.id)
    if (!scoped.exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const body = await request.json()
    if (body.sectionId) {
      const section = await DigitalCourseSectionService.get(body.sectionId)
      if (!section || section.courseId !== scoped.exam.courseId) {
        return NextResponse.json({ error: 'Invalid sectionId' }, { status: 400 })
      }
    }

    if (body.moduleId) {
      const targetModule = await DigitalCourseModuleService.get(body.moduleId)
      const targetSectionId = body.sectionId ?? scoped.exam.sectionId
      if (!targetModule || targetModule.courseId !== scoped.exam.courseId || targetModule.sectionId !== targetSectionId) {
        return NextResponse.json({ error: 'Invalid moduleId' }, { status: 400 })
      }
    }

    const retakePolicy =
      'retakePolicy' in body
        ? body.retakePolicy
          ? {
              maxAttempts:
                typeof body.retakePolicy.maxAttempts === 'number'
                  ? body.retakePolicy.maxAttempts
                  : null,
              cooldownHours:
                typeof body.retakePolicy.cooldownHours === 'number'
                  ? body.retakePolicy.cooldownHours
                  : null,
            }
          : null
        : undefined

    const updated = await DigitalCourseExamService.update(params.examId, {
      ...body,
      retakePolicy,
      updatedBy: guarded.ctx.userId,
    })
    if (!updated) {
      return NextResponse.json({ error: 'Unable to update exam' }, { status: 400 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('DigitalSchool.exam.PUT', error)
    return NextResponse.json({ error: error.message || 'Failed to update exam' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const scoped = await scopeExam(params.examId, guarded.ctx.church?.id)
    if (!scoped.exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    await DigitalCourseExamService.delete(params.examId)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('DigitalSchool.exam.DELETE', error)
    return NextResponse.json({ error: error.message || 'Failed to delete exam' }, { status: 500 })
  }
}
