
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { SermonService } from '@/lib/services/sermon-service'
import { SermonViewService } from '@/lib/services/sermon-view-service'
import { getCorrelationIdFromRequest, logger } from '@/lib/logger'

export async function POST(
  request: Request,
  { params }: { params: { sermonId: string } }
) {
  const correlationId = getCorrelationIdFromRequest(request)
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      logger.warn('sermons.watch.unauthorized', { correlationId, sermonId: params.sermonId })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { sermonId } = params
    logger.info('sermons.watch.request', { correlationId, userId, sermonId })
    const body = await request.json()
    const { watchedDuration, completed } = body

    if (watchedDuration === undefined) {
      logger.warn('sermons.watch.missing_watched_duration', { correlationId, userId, sermonId })
      return NextResponse.json(
        { error: 'Watched duration is required' },
        { status: 400 }
      )
    }

    // Get sermon to check duration
    const sermon = await SermonService.findById(sermonId)

    if (!sermon) {
      logger.warn('sermons.watch.not_found', { correlationId, userId, sermonId })
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

    logger.info('sermons.watch.success', { correlationId, userId, sermonId, isCompleted })
    return NextResponse.json(view)
  } catch (error: any) {
    logger.error('sermons.watch.error', {
      correlationId,
      sermonId: params.sermonId,
      message: error?.message,
      name: error?.name,
    })
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
