import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { SermonService } from '@/lib/services/sermon-service'
import { SermonViewService } from '@/lib/services/sermon-view-service'

export async function POST(
  request: Request,
  { params }: { params: { sermonId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { sermonId } = params
    const body = await request.json()
    const { watchedDuration, completed } = body

    if (watchedDuration === undefined) {
      return NextResponse.json(
        { error: 'Watched duration is required' },
        { status: 400 }
      )
    }

    // Get sermon to check duration
    const sermon = await SermonService.findById(sermonId)

    if (!sermon) {
      return NextResponse.json(
        { error: 'Sermon not found' },
        { status: 404 }
      )
    }

    // Determine if completed (watched 90% or more)
    const isCompleted =
      completed !== undefined
        ? completed
        : sermon.duration
        ? watchedDuration >= sermon.duration * 0.9
        : false

    // Upsert view record
    const view = await SermonViewService.upsert(userId, sermonId, watchedDuration, isCompleted)

    return NextResponse.json(view)
  } catch (error: any) {
    console.error('Error updating watch progress:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

