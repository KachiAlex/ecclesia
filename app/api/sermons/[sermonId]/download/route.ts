import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { SermonService } from '@/lib/services/sermon-service'
import { SermonDownloadService } from '@/lib/services/sermon-view-service'

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

    // Check if already downloaded
    const existing = await SermonDownloadService.findByUserAndSermon(userId, sermonId)

    if (existing) {
      const sermon = await SermonService.findById(sermonId)
      return NextResponse.json({
        success: true,
        message: 'Already downloaded',
        download: existing,
        downloadUrl: sermon?.audioUrl || sermon?.videoUrl,
      })
    }

    // Get sermon
    const sermon = await SermonService.findById(sermonId)

    if (!sermon) {
      return NextResponse.json(
        { error: 'Sermon not found' },
        { status: 404 }
      )
    }

    // Create download record
    const download = await SermonDownloadService.create(userId, sermonId)

    return NextResponse.json({
      success: true,
      download: {
        ...download,
        sermon: {
          title: sermon.title,
          audioUrl: sermon.audioUrl,
          videoUrl: sermon.videoUrl,
        },
      },
      downloadUrl: sermon.audioUrl || sermon.videoUrl,
    })
  } catch (error: any) {
    console.error('Error downloading sermon:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

