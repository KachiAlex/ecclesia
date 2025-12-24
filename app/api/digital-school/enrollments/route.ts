
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  DigitalCourseEnrollmentInput,
  DigitalCourseEnrollmentService,
  DigitalCourseService,
} from '@/lib/services/digital-school-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

function isManager(role?: UserRole) {
  return !!role && MANAGER_ROLES.includes(role)
}

export async function GET(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (courseId) {
      if (!isManager(guarded.ctx.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      const course = await DigitalCourseService.get(courseId)
      if (!course || course.churchId !== guarded.ctx.church?.id) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }

      const enrollments = await DigitalCourseEnrollmentService.listByCourse(courseId)
      return NextResponse.json(enrollments)
    }

    const enrollments = await DigitalCourseEnrollmentService.listByUser(guarded.ctx.userId)
    return NextResponse.json(enrollments)
  } catch (error: any) {
    console.error('DigitalSchool.enrollments.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load enrollments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const body = (await request.json()) as Partial<DigitalCourseEnrollmentInput & { userId?: string }>
    if (!body.courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    if (body.userId && !isManager(guarded.ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to enroll another user' }, { status: 403 })
    }

    const course = await DigitalCourseService.get(body.courseId)
    if (!course || course.churchId !== guarded.ctx.church?.id) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const enrollment = await DigitalCourseEnrollmentService.enroll({
      courseId: body.courseId,
      churchId: course.churchId,
      userId: body.userId ?? guarded.ctx.userId,
    })

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error: any) {
    console.error('DigitalSchool.enrollments.POST', error)
    return NextResponse.json({ error: error.message || 'Failed to enroll' }, { status: 500 })
  }
}
