
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { DigitalCourseSectionService, DigitalCourseService } from '@/lib/services/digital-school-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

type RouteParams = {
  params: {
    sectionId: string
  }
}

async function scopeSection(sectionId: string, churchId?: string) {
  const section = await DigitalCourseSectionService.get(sectionId)
  if (!section) return { section: null, course: null }

  const course = await DigitalCourseService.get(section.courseId)
  if (!course || course.churchId !== churchId) return { section: null, course: null }

  return { section, course }
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const scoped = await scopeSection(params.sectionId, guarded.ctx.church?.id)
    if (!scoped.section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    return NextResponse.json(scoped.section)
  } catch (error: any) {
    console.error('DigitalSchool.section.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load section' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const scoped = await scopeSection(params.sectionId, guarded.ctx.church?.id)
    if (!scoped.section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    const body = await request.json()
    const updated = await DigitalCourseSectionService.update(params.sectionId, body)
    if (!updated) {
      return NextResponse.json({ error: 'Unable to update section' }, { status: 400 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('DigitalSchool.section.PUT', error)
    return NextResponse.json({ error: error.message || 'Failed to update section' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const scoped = await scopeSection(params.sectionId, guarded.ctx.church?.id)
    if (!scoped.section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    await DigitalCourseSectionService.delete(params.sectionId)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('DigitalSchool.section.DELETE', error)
    return NextResponse.json({ error: error.message || 'Failed to delete section' }, { status: 500 })
  }
}
