import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { MeetingService } from '@/lib/services/meeting-service'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/meetings-multi/[id] - Get meeting details
 * PATCH /api/meetings-multi/[id] - Update meeting
 * DELETE /api/meetings-multi/[id] - Delete meeting
 * Requirements: 2.1, 2.3, 6.3
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meeting = await MeetingService.getMeeting(params.id)

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: meeting,
    })
  } catch (error) {
    console.error('Error fetching meeting:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check permissions
    if (!['ADMIN', 'PASTOR', 'LEADER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Verify meeting belongs to user's church
    const meeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      select: { churchId: true },
    })

    if (!meeting || meeting.churchId !== user.churchId) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    const body = await request.json()

    // Update meeting
    const updated = await MeetingService.updateMeeting(params.id, {
      title: body.title,
      description: body.description,
      primaryPlatform: body.primaryPlatform,
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Meeting updated successfully',
    })
  } catch (error) {
    console.error('Error updating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check permissions
    if (!['ADMIN', 'PASTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Verify meeting belongs to user's church
    const meeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      select: { churchId: true },
    })

    if (!meeting || meeting.churchId !== user.churchId) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Delete meeting
    await MeetingService.deleteMeeting(params.id)

    return NextResponse.json({
      success: true,
      message: 'Meeting deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting meeting:', error)
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    )
  }
}
