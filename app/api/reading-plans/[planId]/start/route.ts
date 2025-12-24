
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { ReadingPlanService, ReadingPlanProgressService } from '@/lib/services/reading-plan-service'

export async function POST(
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

    // Check if plan exists
    const plan = await ReadingPlanService.findById(planId)

    if (!plan) {
      return NextResponse.json(
        { error: 'Reading plan not found' },
        { status: 404 }
      )
    }

    // Check if user already has progress
    const existing = await ReadingPlanProgressService.findByUserAndPlan(userId, planId)

    if (existing) {
      return NextResponse.json(
        { error: 'You have already started this reading plan' },
        { status: 400 }
      )
    }

    // Create progress record
    const progress = await ReadingPlanProgressService.create({
      userId,
      planId,
      currentDay: 1,
      completed: false,
    })

    return NextResponse.json({
      ...progress,
      readingPlan: plan,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error starting reading plan:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
