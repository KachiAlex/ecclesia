export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import { GoogleMeetService } from '@/lib/services/google-meet-service'
import { guardApi } from '@/lib/api-guard'

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'PASTOR'] })
    if (!guarded.ok) return guarded.response

    const { church } = guarded.ctx
    const body = await request.json()
    const { title, description, startTime, endTime, attendees } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Meeting title is required' },
        { status: 400 }
      )
    }

    // Create Google Meet
    const meetLink = await GoogleMeetService.createMeeting(church.id, {
      title,
      description,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      attendees,
    })

    return NextResponse.json({
      success: true,
      meetUrl: meetLink.meetUrl,
      eventId: meetLink.eventId,
      calendarId: meetLink.calendarId,
      message: 'Google Meet created successfully',
    })
  } catch (error: any) {
    console.error('Error creating Google Meet:', error)
    
    // Check if Google Meet is not configured
    if (error.message.includes('not configured')) {
      return NextResponse.json(
        { error: 'Google Meet is not configured. Please connect your Google Account in settings.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create Google Meet' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { church } = guarded.ctx
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const calendarId = searchParams.get('calendarId') || 'primary'

    if (!eventId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      )
    }

    const meetingDetails = await GoogleMeetService.getMeetingDetails(
      church.id,
      eventId,
      calendarId
    )

    return NextResponse.json({
      success: true,
      meeting: meetingDetails,
    })
  } catch (error: any) {
    console.error('Error getting Google Meet details:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get meeting details' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'PASTOR'] })
    if (!guarded.ok) return guarded.response

    const { church } = guarded.ctx
    const body = await request.json()
    const { eventId, calendarId = 'primary', title, description, startTime, endTime, attendees } = body

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    const updated = await GoogleMeetService.updateMeeting(
      church.id,
      eventId,
      {
        title,
        description,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        attendees,
      },
      calendarId
    )

    return NextResponse.json({
      success: true,
      meetUrl: updated.meetUrl,
      eventId: updated.eventId,
      message: 'Meeting updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating Google Meet:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update meeting' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'PASTOR'] })
    if (!guarded.ok) return guarded.response

    const { church } = guarded.ctx
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const calendarId = searchParams.get('calendarId') || 'primary'

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    await GoogleMeetService.deleteMeeting(church.id, eventId, calendarId)

    return NextResponse.json({
      success: true,
      message: 'Meeting deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting Google Meet:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete meeting' },
      { status: 500 }
    )
  }
}
