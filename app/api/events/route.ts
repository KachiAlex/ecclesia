import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { EventService } from '@/lib/services/event-service'
import { EventRegistrationService } from '@/lib/services/event-registration-service'
import { getCurrentChurch } from '@/lib/church-context'

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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')
    const groupId = searchParams.get('groupId')
    const branchId = searchParams.get('branchId')

    // Get events using service
    let events = await EventService.findByChurch(church.id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      type: type || undefined,
      groupId: groupId || undefined,
    })

    // Filter by branch if specified
    if (branchId) {
      events = events.filter((event: any) => event.branchId === branchId)
    }

    // Get registration and attendance counts, and user registration status
    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await EventRegistrationService.countByEvent(event.id)
        const userRegistration = await EventRegistrationService.findByUserAndEvent(userId, event.id)

        return {
          ...event,
          userRegistration: userRegistration ? {
            eventId: userRegistration.eventId,
            status: userRegistration.status,
            ticketNumber: userRegistration.ticketNumber,
          } : null,
          availableSpots: event.maxAttendees
            ? event.maxAttendees - registrationCount
            : null,
          _count: {
            registrations: registrationCount,
            attendances: 0, // Would need EventAttendanceService.countByEvent
          },
        }
      })
    )

    return NextResponse.json(eventsWithDetails)
  } catch (error) {
    console.error('Error fetching events:', error)
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
    if (!['ADMIN', 'SUPER_ADMIN', 'PASTOR', 'LEADER'].includes(userRole)) {
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
      type,
      groupId,
      location,
      startDate,
      endDate,
      maxAttendees,
      isTicketed,
      ticketPrice,
      imageUrl,
    } = body

    if (!title || !startDate || !type) {
      return NextResponse.json(
        { error: 'Title, start date, and type are required' },
        { status: 400 }
      )
    }

    const event = await EventService.create({
      title,
      description,
      type,
      churchId: church.id,
      groupId: groupId || undefined,
      location,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      maxAttendees: maxAttendees || undefined,
      isTicketed: isTicketed || false,
      ticketPrice: ticketPrice || undefined,
      imageUrl: imageUrl || undefined,
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error: any) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

