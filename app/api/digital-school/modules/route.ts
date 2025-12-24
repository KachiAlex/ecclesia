
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  DigitalCourseModuleService,
  DigitalCourseService,
  DigitalCourseModuleInput,
  DigitalCourseSectionService,
} from '@/lib/services/digital-school-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

export async function GET(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const sectionId = searchParams.get('sectionId')
    if (!courseId || !sectionId) {
      return NextResponse.json({ error: 'courseId and sectionId are required' }, { status: 400 })
    }

    const course = await DigitalCourseService.get(courseId)
    if (!course || course.churchId !== guarded.ctx.church?.id) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const section = await DigitalCourseSectionService.get(sectionId)
    if (!section || section.courseId !== courseId) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    const modules = await DigitalCourseModuleService.listBySection(sectionId)
    return NextResponse.json(modules)
  } catch (error: any) {
    console.error('DigitalSchool.modules.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load modules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const body = (await request.json()) as Partial<DigitalCourseModuleInput>
    if (!body.courseId || !body.sectionId) {
      return NextResponse.json({ error: 'courseId and sectionId are required' }, { status: 400 })
    }
    if (!body.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const course = await DigitalCourseService.get(body.courseId)
    if (!course || course.churchId !== guarded.ctx.church?.id) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const section = await DigitalCourseSectionService.get(body.sectionId)
    if (!section || section.courseId !== body.courseId) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    const createdModule = await DigitalCourseModuleService.create({
      courseId: body.courseId,
      sectionId: body.sectionId,
      title: body.title,
      description: body.description,
      order: body.order,
      estimatedMinutes: body.estimatedMinutes,
      videoUrl: body.videoUrl,
      audioUrl: body.audioUrl,
      audioFileName: body.audioFileName,
      audioStoragePath: body.audioStoragePath,
      bookUrl: body.bookUrl,
      bookFileName: body.bookFileName,
      bookStoragePath: body.bookStoragePath,
      contentType: body.contentType,
      textContent: body.textContent,
    })

    return NextResponse.json(createdModule, { status: 201 })
  } catch (error: any) {
    console.error('DigitalSchool.modules.POST', error)
    return NextResponse.json({ error: error.message || 'Failed to create module' }, { status: 500 })
  }
}
