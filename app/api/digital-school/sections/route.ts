
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  DigitalCourseSectionService,
  DigitalCourseSectionInput,
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
    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    const course = await DigitalCourseService.get(courseId)
    if (!course || course.churchId !== guarded.ctx.church?.id) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const sections = await DigitalCourseSectionService.listByCourse(courseId)
    return NextResponse.json(sections)
  } catch (error: any) {
    console.error('DigitalSchool.sections.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load sections' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const body = (await request.json()) as Partial<DigitalCourseSectionInput>
    if (!body.courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }
    if (!body.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const course = await DigitalCourseService.get(body.courseId)
    if (!course || course.churchId !== guarded.ctx.church?.id) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const section = await DigitalCourseSectionService.create({
      courseId: body.courseId,
      title: body.title,
      description: body.description,
      estimatedHours: body.estimatedHours,
      order: body.order,
    })

    return NextResponse.json(section, { status: 201 })
  } catch (error: any) {
    console.error('DigitalSchool.sections.POST', error)
    return NextResponse.json({ error: error.message || 'Failed to create section' }, { status: 500 })
  }
}
