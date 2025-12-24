
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { CheckInService } from '@/lib/services/checkin-service'
import { EventService } from '@/lib/services/event-service'
import { getCurrentChurch } from '@/lib/church-context'
import { generateQRCode } from '@/lib/qr-code'

export async function POST(request: Request) {
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

    const body = await request.json()
    const { eventId, location, qrCode } = body

    // Generate QR code if not provided
    const checkInQRCode = qrCode || generateQRCode('CHECKIN')

    const checkIn = await CheckInService.create({
      userId,
      eventId: eventId || undefined,
      qrCode: checkInQRCode,
      location: location || undefined,
      checkedInAt: new Date(),
    })

    return NextResponse.json(checkIn, { status: 201 })
  } catch (error: any) {
    console.error('Error creating check-in:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    let checkIns = await CheckInService.findByUser(userId, 50)

    // Filter by event if provided
    if (eventId) {
      checkIns = checkIns.filter(checkIn => checkIn.eventId === eventId)
    }

    // Add event info
    const checkInsWithEvents = await Promise.all(
      checkIns.map(async (checkIn) => {
        let event = null
        if (checkIn.eventId) {
          event = await EventService.findById(checkIn.eventId)
        }
        return {
          ...checkIn,
          event: event ? {
            id: event.id,
            title: event.title,
            startDate: event.startDate,
          } : null,
        }
      })
    )

    return NextResponse.json(checkInsWithEvents)
  } catch (error) {
    console.error('Error fetching check-ins:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
