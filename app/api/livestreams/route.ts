import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { LivestreamService } from '@/lib/services/livestream-service'
import { StreamingPlatform, LivestreamStatus } from '@/lib/types/streaming'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/livestreams - List livestreams
 * POST /api/livestreams - Create livestream
 * Requirements: 1.1, 1.2, 6.1, 6.2
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's church
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { churchId: true, role: true },
    })

    if (!user?.churchId) {
      return NextResponse.json({ error: 'User not associated with a church' }, { status: 400 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as LivestreamStatus | null

    // Get livestreams
    const livestreams = await LivestreamService.getLivestreams(user.churchId, status || undefined)

    return NextResponse.json({
      success: true,
      data: livestreams,
    })
  } catch (error) {
    console.error('Error fetching livestreams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch livestreams' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, churchId: true, role: true },
    })

    if (!user?.churchId) {
      return NextResponse.json({ error: 'User not associated with a church' }, { status: 400 })
    }

    // Check permissions (only admins and pastors can create livestreams)
    if (!['ADMIN', 'PASTOR', 'LEADER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.platforms || body.platforms.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title, platforms' },
        { status: 400 }
      )
    }

    if (body.startAt) {
      const parsedDate = new Date(body.startAt)
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid startAt date' }, { status: 400 })
      }
    }

    // Validate platforms payload (expects array of { platform, settings? })
    if (!Array.isArray(body.platforms)) {
      return NextResponse.json({ error: 'Platforms must be an array' }, { status: 400 })
    }

    const validPlatforms = Object.values(StreamingPlatform)
    for (const platformEntry of body.platforms) {
      if (!platformEntry?.platform || !validPlatforms.includes(platformEntry.platform)) {
        return NextResponse.json({ error: `Invalid platform: ${platformEntry?.platform}` }, { status: 400 })
      }
      if (platformEntry.settings && typeof platformEntry.settings !== 'object') {
        return NextResponse.json(
          { error: `Invalid settings for platform: ${platformEntry.platform}` },
          { status: 400 }
        )
      }
    }

    // Create livestream
    const livestream = await LivestreamService.createLivestream(
      user.churchId,
      user.id,
      {
        title: body.title,
        description: body.description,
        thumbnail: body.thumbnail,
        startAt: body.startAt ? new Date(body.startAt) : undefined,
        platforms: body.platforms,
      }
    )

    return NextResponse.json(
      {
        success: true,
        data: livestream,
        message: 'Livestream created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating livestream:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create livestream' },
      { status: 500 }
    )
  }
}
