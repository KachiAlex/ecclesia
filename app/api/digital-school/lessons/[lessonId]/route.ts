import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  DigitalCourseLessonService,
  DigitalCourseModuleService,
  DigitalCourseService,
} from '@/lib/services/digital-school-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

type RouteParams = {
  params: {
    lessonId: string
  }
}

async function ensureLessonScope(lessonId: string, churchId?: string) {
  const lesson = await DigitalCourseLessonService.get(lessonId)
  if (!lesson) return { lesson: null, course: null }
  const course = await DigitalCourseService.get(lesson.courseId)
  if (!course || course.churchId !== churchId) return { lesson: null, course: null }
  return { lesson, course }
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const scoped = await ensureLessonScope(params.lessonId, guarded.ctx.church?.id)
    if (!scoped.lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    return NextResponse.json(scoped.lesson)
  } catch (error: any) {
    console.error('DigitalSchool.lesson.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load lesson' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const scoped = await ensureLessonScope(params.lessonId, guarded.ctx.church?.id)
    if (!scoped.lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    const body = await request.json()

    if (body.moduleId) {
      const targetModule = await DigitalCourseModuleService.get(body.moduleId)
      if (!targetModule || targetModule.courseId !== scoped.lesson.courseId) {
        return NextResponse.json({ error: 'Invalid moduleId' }, { status: 400 })
      }
    }

    const updated = await DigitalCourseLessonService.update(params.lessonId, body)
    if (!updated) {
      return NextResponse.json({ error: 'Unable to update lesson' }, { status: 400 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('DigitalSchool.lesson.PUT', error)
    return NextResponse.json({ error: error.message || 'Failed to update lesson' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const scoped = await ensureLessonScope(params.lessonId, guarded.ctx.church?.id)
    if (!scoped.lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    await DigitalCourseLessonService.delete(params.lessonId)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('DigitalSchool.lesson.DELETE', error)
    return NextResponse.json({ error: error.message || 'Failed to delete lesson' }, { status: 500 })
  }
}
