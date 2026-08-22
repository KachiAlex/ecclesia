
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { ReadingPlanResourceService } from '@/lib/services/reading-plan-day-service'

type RouteParams = {
  resourceId: string
}

export async function GET(request: Request, { params }: { params: RouteParams }) {
  try {
    const guard = await guardApi()
    if (!guard.ok) return guard.response

    const resource = await ReadingPlanResourceService.findById(params.resourceId)
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    return NextResponse.json({ resource })
  } catch (error: any) {
    console.error('Error fetching resource:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch resource' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: RouteParams }) {
  try {
    const guard = await guardApi({
      allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PASTOR'],
    })
    if (!guard.ok) return guard.response

    const body = await request.json()
    const updated = await ReadingPlanResourceService.update(params.resourceId, body)
    if (!updated) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    return NextResponse.json({ resource: updated })
  } catch (error: any) {
    console.error('Error updating resource:', error)
    return NextResponse.json({ error: error.message || 'Failed to update resource' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: RouteParams }) {
  try {
    const guard = await guardApi({
      allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PASTOR'],
    })
    if (!guard.ok) return guard.response

    await ReadingPlanResourceService.delete(params.resourceId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting resource:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete resource' }, { status: 500 })
  }
}
