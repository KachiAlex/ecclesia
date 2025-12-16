import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { ReadingPlanService, ReadingPlanProgressService } from '@/lib/services/reading-plan-service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Get reading plan
    const plan = await ReadingPlanService.findById(planId)
    if (!plan) {
      return NextResponse.json(
        { error: 'Reading plan not found' },
        { status: 404 }
      )
    }

    // Get user progress
    const progress = await ReadingPlanProgressService.findByUserAndPlan(userId, planId)

    return NextResponse.json({
      ...plan,
      userProgress: progress ? {
        id: progress.id,
        currentDay: progress.currentDay,
        completed: progress.completed,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
      } : null,
    })
  } catch (error: any) {
    console.error('Error fetching reading plan:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

