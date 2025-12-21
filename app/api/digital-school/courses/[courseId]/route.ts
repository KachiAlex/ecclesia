import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { DigitalCourseService } from '@/lib/services/digital-school-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

type RouteParams = {
  params: {
    courseId: string
  }
}

async function ensureScopedCourse(courseId: string, churchId?: string) {
  const course = await DigitalCourseService.get(courseId)
  if (!course || course.churchId !== churchId) return null
  return course
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const course = await ensureScopedCourse(params.courseId, guarded.ctx.church?.id)
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (error: any) {
    console.error('DigitalSchool.course.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load course' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const course = await ensureScopedCourse(params.courseId, guarded.ctx.church?.id)
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const body = await request.json()
    const updated = await DigitalCourseService.update(params.courseId, {
      ...body,
      updatedBy: guarded.ctx.userId,
    })

    if (!updated) {
      return NextResponse.json({ error: 'Unable to update course' }, { status: 400 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('DigitalSchool.course.PUT', error)
    return NextResponse.json({ error: error.message || 'Failed to update course' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const course = await ensureScopedCourse(params.courseId, guarded.ctx.church?.id)
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    await DigitalCourseService.delete(params.courseId)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('DigitalSchool.course.DELETE', error)
    return NextResponse.json({ error: error.message || 'Failed to delete course' }, { status: 500 })
  }
}
