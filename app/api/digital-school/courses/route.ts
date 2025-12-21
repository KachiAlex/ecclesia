import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { DigitalCourseService, DigitalCourseInput } from '@/lib/services/digital-school-service'
import { UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

export async function GET(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { church } = guarded.ctx
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 50

    const courses = await DigitalCourseService.list(church!.id, limit)
    return NextResponse.json(courses)
  } catch (error: any) {
    console.error('DigitalSchool.courses.GET', error)
    return NextResponse.json({ error: error.message || 'Failed to load courses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const { church, userId } = guarded.ctx
    const body = (await request.json()) as Partial<DigitalCourseInput>

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const course = await DigitalCourseService.create({
      churchId: church!.id,
      title: body.title,
      summary: body.summary,
      accessType: body.accessType,
      mentors: body.mentors,
      estimatedHours: body.estimatedHours,
      coverImageUrl: body.coverImageUrl,
      tags: body.tags,
      status: body.status,
      createdBy: userId,
      updatedBy: userId,
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error: any) {
    console.error('DigitalSchool.courses.POST', error)
    return NextResponse.json({ error: error.message || 'Failed to create course' }, { status: 500 })
  }
}
