import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { MeetingService } from '@/lib/services/meeting-service'
import { StreamingPlatform, MeetingStatus } from '@/lib/types/streaming'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/meetings-multi - List meetings with multiple platforms
 * POST /api/meetings-multi - Create meeting with multiple platforms
 * Requirements: 2.1, 2.2, 6.3
 */

export const runtime = 'nodejs'

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
    const status = searchParams.get('status') as MeetingStatus | null

    // Get meetings
    const meetings = await MeetingService.getMeetings(user.churchId, status || undefined)

    return NextResponse.json({
      success: true,
      data: meetings,
    })
  } catch (error) {
    console.error('Error fetching meetings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
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

    // Check permissions (only admins and pastors can create meetings)
    if (!['ADMIN', 'PASTOR', 'LEADER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.startAt || !body.endAt || !body.platforms || body.platforms.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title, startAt, endAt, platforms' },
        { status: 400 }
      )
    }

    // Validate platforms
    const validPlatforms = Object.values(StreamingPlatform)
    for (const platform of body.platforms) {
      if (!validPlatforms.includes(platform.platform)) {
        return NextResponse.json(
          { error: `Invalid platform: ${platform.platform}` },
          { status: 400 }
        )
      }
    }

    // Validate primary platform if specified
    if (body.primaryPlatform && !validPlatforms.includes(body.primaryPlatform)) {
      return NextResponse.json(
        { error: `Invalid primary platform: ${body.primaryPlatform}` },
        { status: 400 }
      )
    }

    // Create meeting
    const meeting = await MeetingService.createMeeting(
      user.churchId,
      user.id,
      {
        title: body.title,
        description: body.description,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
        primaryPlatform: body.primaryPlatform,
        platforms: body.platforms,
      }
    )

    return NextResponse.json(
      {
        success: true,
        data: meeting,
        message: 'Meeting created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating meeting:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create meeting' },
      { status: 500 }
    )
  }
}
