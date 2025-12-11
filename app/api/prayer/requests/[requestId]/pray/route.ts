import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { PrayerInteractionService } from '@/lib/services/prayer-service'

export async function POST(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { requestId } = params
    const body = await request.json()
    const { comment } = body

    // Check if already prayed
    const existing = await PrayerInteractionService.findByUserAndRequest(userId, requestId)

    if (existing) {
      // Update existing interaction
      const updated = await PrayerInteractionService.update(existing.id, comment)
      return NextResponse.json({ prayed: true, interaction: updated })
    } else {
      // Create new interaction
      const interaction = await PrayerInteractionService.create({
        userId,
        requestId,
        type: 'Prayed',
        comment: comment || undefined,
      })

      return NextResponse.json({ prayed: true, interaction })
    }
  } catch (error: any) {
    console.error('Error recording prayer:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

