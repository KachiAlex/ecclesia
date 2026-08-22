
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { ReadingPlanResourceService } from '@/lib/services/reading-plan-day-service'

type RouteParams = {
  planId: string
}

export async function GET(request: Request, { params }: { params: RouteParams }) {
  try {
    const guard = await guardApi()
    if (!guard.ok) return guard.response

    const planId = params.planId
    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 })
    }

    const resources = await ReadingPlanResourceService.listByPlan(planId)
    return NextResponse.json({ resources })
  } catch (error: any) {
    console.error('Error fetching reading plan resources:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch resources' }, { status: 500 })
  }
}
