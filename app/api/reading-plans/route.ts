import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { ReadingPlanService, ReadingPlanProgressService } from '@/lib/services/reading-plan-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get('userId')
    const sessionUserId = (session.user as any)?.id as string | undefined
    const userId = userIdParam === 'current' ? sessionUserId : userIdParam

    // Get all reading plans
    let plans = await ReadingPlanService.findAll(100)

    // Filter by difficulty if provided (would need to add difficulty field)
    // Filter by topic if provided (would need to add topics field)

    // Get progress counts and user progress
    const plansWithDetails = await Promise.all(
      plans.map(async (plan) => {
        // Get progress count
        const progressSnapshot = await db.collection(COLLECTIONS.readingPlanProgress)
          .where('planId', '==', plan.id)
          .count()
          .get()

        let userProgress = null
        if (userId) {
          userProgress = await ReadingPlanProgressService.findByUserAndPlan(userId, plan.id)
        }

        return {
          ...plan,
          _count: {
            progress: progressSnapshot.data().count || 0,
          },
          userProgress: userProgress ? {
            readingPlanId: userProgress.planId,
            currentDay: userProgress.currentDay,
            completed: userProgress.completed,
          } : null,
        }
      })
    )

    return NextResponse.json(plansWithDetails)
  } catch (error) {
    console.error('Error fetching reading plans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (!['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, duration, difficulty, topics } = body

    if (!title || !duration) {
      return NextResponse.json(
        { error: 'Title and duration are required' },
        { status: 400 }
      )
    }

    const plan = await ReadingPlanService.create({
      title,
      description,
      duration: parseInt(duration),
      startDate: undefined,
      endDate: undefined,
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error: any) {
    console.error('Error creating reading plan:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

