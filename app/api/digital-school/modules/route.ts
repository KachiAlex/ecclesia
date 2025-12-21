import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  DigitalCourseModuleService,
  DigitalCourseService,
  DigitalCourseModuleInput,
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

    const modules = await DigitalCourseModuleService.listByCourse(courseId)
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

    const module = await DigitalCourseModuleService.create({
      courseId: body.courseId,
      title: body.title,
      description: body.description,
      order: body.order,
      estimatedMinutes: body.estimatedMinutes,
    })

    return NextResponse.json(module, { status: 201 })
  } catch (error: any) {
    console.error('DigitalSchool.modules.POST', error)
    return NextResponse.json({ error: error.message || 'Failed to create module' }, { status: 500 })
  }
}
