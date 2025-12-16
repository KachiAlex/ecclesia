import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { SermonService } from '@/lib/services/sermon-service'
import { getCurrentChurch } from '@/lib/church-context'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get sermons using service
    const sermons = await SermonService.findByChurch(church.id, {
      category: category || undefined,
      search: search || undefined,
      tag: tag || undefined,
      limit,
    })

    // Get user's watch progress
    const userViewsSnapshot = await db.collection(COLLECTIONS.sermonViews)
      .where('userId', '==', userId)
      .get()

    const viewMap = new Map(
      userViewsSnapshot.docs.map((doc: any) => {
        const data = doc.data()
        return [data.sermonId, {
          watchedDuration: data.watchedDuration || 0,
          completed: data.completed || false,
        }]
      })
    )

    // Get view and download counts
    const sermonsWithDetails = await Promise.all(
      sermons.map(async (sermon) => {
        const view = viewMap.get(sermon.id)
        
        // Get view count
        const viewsSnapshot = await db.collection(COLLECTIONS.sermonViews)
          .where('sermonId', '==', sermon.id)
          .count()
          .get()
        
        // Get download count
        const downloadsSnapshot = await db.collection(COLLECTIONS.sermonDownloads)
          .where('sermonId', '==', sermon.id)
          .count()
          .get()

        return {
          ...sermon,
          userProgress: view
            ? {
                watchedDuration: (view as any).watchedDuration,
                completed: (view as any).completed,
                progress:
                  sermon.duration
                    ? ((view as any).watchedDuration / sermon.duration) * 100
                    : 0,
              }
            : null,
          _count: {
            views: viewsSnapshot.data().count || 0,
            downloads: downloadsSnapshot.data().count || 0,
          },
        }
      })
    )

    // Get total count
    const totalSnapshot = await db.collection(COLLECTIONS.sermons)
      .where('churchId', '==', church.id)
      .count()
      .get()
    const total = totalSnapshot.data().count || sermons.length

    return NextResponse.json({
      sermons: sermonsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching sermons:', error)
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

    const userId = (session.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      speaker,
      videoUrl,
      audioUrl,
      thumbnailUrl,
      duration,
      category,
      tags,
    } = body

    if (!title || !speaker) {
      return NextResponse.json(
        { error: 'Title and speaker are required' },
        { status: 400 }
      )
    }

    const sermon = await SermonService.create({
      title,
      description,
      speaker,
      videoUrl: videoUrl || undefined,
      audioUrl: audioUrl || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      duration: duration ? parseInt(duration) : undefined,
      category: category || undefined,
      tags: tags || [],
      topics: [], // Default empty topics array
      churchId: church.id,
    })

    // Generate AI summary if OpenAI or DeepSeek is available
    if (description && (process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY)) {
      try {
        const { generateSermonSummary } = await import('@/lib/ai/openai')
        const summary = await generateSermonSummary(description, title)
        
        await SermonService.update(sermon.id, {
          aiSummary: summary,
        })
      } catch (error) {
        console.error('Error generating AI summary:', error)
        // Don't fail sermon creation if AI summary fails
      }
    }

    return NextResponse.json(sermon, { status: 201 })
  } catch (error: any) {
    console.error('Error creating sermon:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

