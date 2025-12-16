import { NextResponse } from 'next/server'
import { SermonService } from '@/lib/services/sermon-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { guardApi } from '@/lib/api-guard'
import { checkUsageLimit } from '@/lib/subscription'

export async function GET(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { userId, church } = guarded.ctx

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')
    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor')

    if (search && tag) {
      return NextResponse.json(
        { error: 'Search cannot be combined with tag filter' },
        { status: 400 }
      )
    }

    // Get sermons using service
    const sermons = await SermonService.findByChurch(church.id, {
      category: category || undefined,
      search: search || undefined,
      tag: tag || undefined,
      limit,
      lastDocId: cursor || undefined,
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

    // Get view and download counts (cached on sermon docs)
    const sermonsWithDetails = await Promise.all(
      sermons.map(async (sermon) => {
        const view = viewMap.get(sermon.id)

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
            views: (sermon as any).viewsCount || 0,
            downloads: (sermon as any).downloadsCount || 0,
          },
        }
      })
    )

    const nextCursor = sermons.length === limit ? sermons[sermons.length - 1].id : null

    return NextResponse.json({
      sermons: sermonsWithDetails,
      pagination: {
        limit,
        nextCursor,
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
    const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PASTOR'] })
    if (!guarded.ok) return guarded.response

    const { userId, church } = guarded.ctx

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

    const usageCheck = await checkUsageLimit(church.id, 'maxSermons')
    if (!usageCheck.allowed && usageCheck.limit) {
      return NextResponse.json(
        {
          error: `Sermon limit reached. Maximum ${usageCheck.limit} sermons allowed on your plan.`,
          limit: usageCheck.limit,
          current: usageCheck.current,
        },
        { status: 403 }
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

