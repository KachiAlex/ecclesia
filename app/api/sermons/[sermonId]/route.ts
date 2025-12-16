import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { SermonService } from '@/lib/services/sermon-service'
import { SermonViewService, SermonDownloadService } from '@/lib/services/sermon-view-service'
import { ChurchService } from '@/lib/services/church-service'
import { getCorrelationIdFromRequest, logger } from '@/lib/logger'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sermonId: string }> }
) {
  const correlationId = getCorrelationIdFromRequest(request)
  try {
    const { sermonId } = await params
    logger.info('sermons.detail.request', { correlationId, sermonId })
    const session = await getServerSession(authOptions)
    if (!session) {
      logger.warn('sermons.detail.unauthorized', { correlationId, sermonId })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const sermon = await SermonService.findById(sermonId)

    if (!sermon) {
      logger.warn('sermons.detail.not_found', { correlationId, sermonId, userId })
      return NextResponse.json(
        { error: 'Sermon not found' },
        { status: 404 }
      )
    }

    // Get church info
    const church = await ChurchService.findById(sermon.churchId)

    // Get user's watch progress
    const userView = await SermonViewService.findByUserAndSermon(userId, sermonId)

    // Get download status
    const userDownload = await SermonDownloadService.findByUserAndSermon(userId, sermonId)

    return NextResponse.json({
      ...sermon,
      church: church ? {
        id: church.id,
        name: church.name,
      } : null,
      _count: {
        views: (sermon as any).viewsCount || 0,
        downloads: (sermon as any).downloadsCount || 0,
      },
      userProgress: userView
        ? {
            watchedDuration: userView.watchedDuration,
            completed: userView.completed,
            progress: sermon.duration
              ? (userView.watchedDuration / sermon.duration) * 100
              : 0,
          }
        : null,
      isDownloaded: !!userDownload,
    })
  } catch (error) {
    logger.error('sermons.detail.error', {
      correlationId,
      message: (error as any)?.message,
      name: (error as any)?.name,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

