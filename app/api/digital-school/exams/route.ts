import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  DigitalCourseExamInput,
  DigitalCourseExamService,
  DigitalCourseModuleService,
  DigitalCourseSectionService,
  DigitalCourseService,
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

    const exams = await DigitalCourseExamService.listBySection(sectionId)
    return NextResponse.json(exams)
  } catch (error: any) {
    console.error('DigitalSchool.exams.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load exams' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const body = (await request.json()) as Partial<DigitalCourseExamInput>
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

    if (body.moduleId) {
      const targetModule = await DigitalCourseModuleService.get(body.moduleId)
      if (!targetModule || targetModule.courseId !== body.courseId || targetModule.sectionId !== body.sectionId) {
        return NextResponse.json({ error: 'Invalid moduleId' }, { status: 400 })
      }
    }

    const exam = await DigitalCourseExamService.create({
      courseId: body.courseId,
      sectionId: body.sectionId,
      moduleId: body.moduleId,
      title: body.title,
      description: body.description,
      timeLimitMinutes: body.timeLimitMinutes,
      status: body.status,
      uploadMetadata: body.uploadMetadata,
      createdBy: guarded.ctx.userId,
      updatedBy: guarded.ctx.userId,
    })

    return NextResponse.json(exam, { status: 201 })
  } catch (error: any) {
    console.error('DigitalSchool.exams.POST', error)
    return NextResponse.json({ error: error.message || 'Failed to create exam' }, { status: 500 })
  }
}
