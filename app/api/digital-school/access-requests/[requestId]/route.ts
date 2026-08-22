
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import {
  AccessRequestStatus,
  DigitalCourseAccessRequestService,
  DigitalCourseService,
} from '@/lib/services/digital-school-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

const ALLOWED_STATUSES: AccessRequestStatus[] = ['approved', 'declined', 'more_info']

type RouteParams = {
  params: {
    requestId: string
  }
}

async function loadScopedRequest(requestId: string, churchId?: string) {
  const requestDoc = await DigitalCourseAccessRequestService.get(requestId)
  if (!requestDoc) return { requestDoc: null, course: null }
  const course = await DigitalCourseService.get(requestDoc.courseId)
  if (!course || course.churchId !== churchId) return { requestDoc: null, course: null }
  return { requestDoc, course }
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const scoped = await loadScopedRequest(params.requestId, guarded.ctx.church?.id)
    if (!scoped.requestDoc) {
      return NextResponse.json({ error: 'Access request not found' }, { status: 404 })
    }

    return NextResponse.json(scoped.requestDoc)
  } catch (error: any) {
    console.error('DigitalSchool.accessRequest.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load access request' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const scoped = await loadScopedRequest(params.requestId, guarded.ctx.church?.id)
    if (!scoped.requestDoc) {
      return NextResponse.json({ error: 'Access request not found' }, { status: 404 })
    }

    const { status, reviewerNote } = await request.json()
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updated = await DigitalCourseAccessRequestService.updateStatus(
      params.requestId,
      status,
      guarded.ctx.userId,
      reviewerNote,
    )

    if (!updated) {
      return NextResponse.json({ error: 'Unable to update access request' }, { status: 400 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('DigitalSchool.accessRequest.PUT', error)
    return NextResponse.json({ error: error.message || 'Failed to update access request' }, { status: 500 })
  }
}
