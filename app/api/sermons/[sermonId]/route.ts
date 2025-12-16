import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { SermonService } from '@/lib/services/sermon-service'
import { SermonViewService, SermonDownloadService } from '@/lib/services/sermon-view-service'
import { ChurchService } from '@/lib/services/church-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sermonId: string }> }
) {
  try {
    const { sermonId } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const sermon = await SermonService.findById(sermonId)

    if (!sermon) {
      return NextResponse.json(
        { error: 'Sermon not found' },
        { status: 404 }
      )
    }

    // Get church info
    const church = await ChurchService.findById(sermon.churchId)

    // Get counts
    const [viewsCount, downloadsCount] = await Promise.all([
      db.collection(COLLECTIONS.sermonViews).where('sermonId', '==', sermonId).count().get(),
      db.collection(COLLECTIONS.sermonDownloads).where('sermonId', '==', sermonId).count().get(),
    ])

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
        views: viewsCount.data().count || 0,
        downloads: downloadsCount.data().count || 0,
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
    console.error('Error fetching sermon:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

