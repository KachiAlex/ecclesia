
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  DigitalCourseAccessRequestService,
  DigitalCourseService,
  DigitalCourseAccessRequestInput,
} from '@/lib/services/digital-school-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

export async function GET(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status') as any

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    const course = await DigitalCourseService.get(courseId)
    if (!course || course.churchId !== guarded.ctx.church?.id) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const requests = await DigitalCourseAccessRequestService.listByCourse(courseId, status)
    return NextResponse.json(requests)
  } catch (error: any) {
    console.error('DigitalSchool.accessRequests.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load access requests' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const body = (await request.json()) as Partial<DigitalCourseAccessRequestInput>
    if (!body.courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    const course = await DigitalCourseService.get(body.courseId)
    if (!course || course.churchId !== guarded.ctx.church?.id) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const requestDoc = await DigitalCourseAccessRequestService.submit({
      courseId: body.courseId,
      userId: guarded.ctx.userId,
      reason: body.reason,
    })

    return NextResponse.json(requestDoc, { status: 201 })
  } catch (error: any) {
    console.error('DigitalSchool.accessRequests.POST', error)
    return NextResponse.json({ error: error.message || 'Failed to submit access request' }, { status: 500 })
  }
}
