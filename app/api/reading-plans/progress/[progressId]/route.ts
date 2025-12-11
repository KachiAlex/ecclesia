import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { ReadingPlanProgressService } from '@/lib/services/reading-plan-service'
import { ReadingPlanService } from '@/lib/services/reading-plan-service'

export async function PUT(
  request: Request,
  { params }: { params: { progressId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { progressId } = params
    const body = await request.json()
    const { currentDay, completed } = body

    // Verify progress belongs to user
    const progress = await ReadingPlanProgressService.findById(progressId)

    if (!progress || progress.userId !== userId) {
      return NextResponse.json(
        { error: 'Progress not found' },
        { status: 404 }
      )
    }

    // Update progress
    const updated = await ReadingPlanProgressService.updateProgress(
      progressId,
      currentDay !== undefined ? currentDay : progress.currentDay,
      completed
    )

    // Get reading plan
    const readingPlan = await ReadingPlanService.findById(updated.planId)

    return NextResponse.json({
      ...updated,
      readingPlan,
    })
  } catch (error: any) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

