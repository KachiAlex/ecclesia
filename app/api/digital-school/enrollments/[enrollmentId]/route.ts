import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  DigitalCourseEnrollmentService,
  DigitalCourseService,
} from '@/lib/services/digital-school-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

const isManager = (role?: UserRole) => !!role && MANAGER_ROLES.includes(role)

type RouteParams = {
  params: {
    enrollmentId: string
  }
}

async function loadEnrollment(enrollmentId: string) {
  const enrollment = await DigitalCourseEnrollmentService.get(enrollmentId)
  if (!enrollment) return { enrollment: null, course: null }
  const course = await DigitalCourseService.get(enrollment.courseId)
  if (!course) return { enrollment: null, course: null }
  return { enrollment, course }
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const scoped = await loadEnrollment(params.enrollmentId)
    if (!scoped.enrollment || scoped.course?.churchId !== guarded.ctx.church?.id) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    if (scoped.enrollment.userId !== guarded.ctx.userId && !isManager(guarded.ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    return NextResponse.json(scoped.enrollment)
  } catch (error: any) {
    console.error('DigitalSchool.enrollment.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load enrollment' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const scoped = await loadEnrollment(params.enrollmentId)
    if (!scoped.enrollment || scoped.course?.churchId !== guarded.ctx.church?.id) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    const isOwner = scoped.enrollment.userId === guarded.ctx.userId
    if (!isOwner && !isManager(guarded.ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    if (!isManager(guarded.ctx.role)) {
      if (body.status || body.badgeIssuedAt) {
        return NextResponse.json({ error: 'Only managers can change status or badge' }, { status: 403 })
      }
    }

    const badgeIssuedAt = body.badgeIssuedAt ? new Date(body.badgeIssuedAt) : undefined

    const updated = await DigitalCourseEnrollmentService.updateProgress(
      params.enrollmentId,
      body.progressPercent,
      body.moduleProgress,
      body.status,
      badgeIssuedAt,
    )

    if (!updated) {
      return NextResponse.json({ error: 'Unable to update enrollment' }, { status: 400 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('DigitalSchool.enrollment.PUT', error)
    return NextResponse.json({ error: error.message || 'Failed to update enrollment' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const scoped = await loadEnrollment(params.enrollmentId)
    if (!scoped.enrollment || scoped.course?.churchId !== guarded.ctx.church?.id) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    const isOwner = scoped.enrollment.userId === guarded.ctx.userId
    if (!isOwner && !isManager(guarded.ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const updated = await DigitalCourseEnrollmentService.updateProgress(params.enrollmentId, undefined, undefined, 'withdrawn')
    if (!updated) {
      return NextResponse.json({ error: 'Unable to withdraw' }, { status: 400 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('DigitalSchool.enrollment.DELETE', error)
    return NextResponse.json({ error: error.message || 'Failed to withdraw' }, { status: 500 })
  }
}
