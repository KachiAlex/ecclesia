import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { DigitalCourseModuleService, DigitalCourseService } from '@/lib/services/digital-school-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

type RouteParams = {
  params: {
    moduleId: string
  }
}

async function ensureScopedCourse(moduleId: string, churchId?: string) {
  const module = await DigitalCourseModuleService.get(moduleId)
  if (!module) return { module: null, course: null }
  const course = await DigitalCourseService.get(module.courseId)
  if (!course || course.churchId !== churchId) return { module: null, course: null }
  return { module, course }
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const scoped = await ensureScopedCourse(params.moduleId, guarded.ctx.church?.id)
    if (!scoped.module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    return NextResponse.json(scoped.module)
  } catch (error: any) {
    console.error('DigitalSchool.module.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load module' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const scoped = await ensureScopedCourse(params.moduleId, guarded.ctx.church?.id)
    if (!scoped.module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    const body = await request.json()
    const updated = await DigitalCourseModuleService.update(params.moduleId, body)
    if (!updated) {
      return NextResponse.json({ error: 'Unable to update module' }, { status: 400 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('DigitalSchool.module.PUT', error)
    return NextResponse.json({ error: error.message || 'Failed to update module' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const scoped = await ensureScopedCourse(params.moduleId, guarded.ctx.church?.id)
    if (!scoped.module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    await DigitalCourseModuleService.delete(params.moduleId)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('DigitalSchool.module.DELETE', error)
    return NextResponse.json({ error: error.message || 'Failed to delete module' }, { status: 500 })
  }
}
