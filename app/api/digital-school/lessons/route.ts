
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  DigitalCourseLessonService,
  DigitalCourseLessonInput,
  DigitalCourseModuleService,
  DigitalCourseService,
} from '@/lib/services/digital-school-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

async function ensureModuleScope(moduleId: string, churchId?: string) {
  const targetModule = await DigitalCourseModuleService.get(moduleId)
  if (!targetModule) return { module: null, course: null }
  const course = await DigitalCourseService.get(targetModule.courseId)
  if (!course || course.churchId !== churchId) return { module: null, course: null }
  return { module: targetModule, course }
}

export async function GET(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('moduleId')
    if (!moduleId) {
      return NextResponse.json({ error: 'moduleId is required' }, { status: 400 })
    }

    const scoped = await ensureModuleScope(moduleId, guarded.ctx.church?.id)
    if (!scoped.module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    const lessons = await DigitalCourseLessonService.listByModule(moduleId)
    return NextResponse.json(lessons)
  } catch (error: any) {
    console.error('DigitalSchool.lessons.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load lessons' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const body = (await request.json()) as Partial<DigitalCourseLessonInput>
    if (!body.moduleId || !body.courseId) {
      return NextResponse.json({ error: 'courseId and moduleId are required' }, { status: 400 })
    }
    if (!body.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const scoped = await ensureModuleScope(body.moduleId, guarded.ctx.church?.id)
    if (!scoped.module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    const lesson = await DigitalCourseLessonService.create({
      courseId: body.courseId,
      moduleId: body.moduleId,
      title: body.title,
      description: body.description,
      videoUrl: body.videoUrl,
      audioUrl: body.audioUrl,
      attachmentUrls: body.attachmentUrls,
      transcript: body.transcript,
      order: body.order,
    })

    return NextResponse.json(lesson, { status: 201 })
  } catch (error: any) {
    console.error('DigitalSchool.lessons.POST', error)
    return NextResponse.json({ error: error.message || 'Failed to create lesson' }, { status: 500 })
  }
}
