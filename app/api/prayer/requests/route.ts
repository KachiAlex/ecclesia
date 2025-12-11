import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { PrayerRequestService } from '@/lib/services/prayer-service'
import { getCurrentChurch } from '@/lib/church-context'
import { UserService } from '@/lib/services/user-service'
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
    const status = searchParams.get('status')

    // Get prayer requests
    const requests = await PrayerRequestService.findByChurch(church.id, {
      status: status || undefined,
      limit: 50,
    })

    // Get user data and check interactions
    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const user = await UserService.findById(request.userId)
        
        // Check if current user has prayed
        const interactionDoc = await db.collection(COLLECTIONS.prayerInteractions)
          .where('requestId', '==', request.id)
          .where('userId', '==', userId)
          .where('type', '==', 'Prayed')
          .limit(1)
          .get()

        return {
          ...request,
          user: user && !request.isAnonymous ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImage: user.profileImage,
          } : null,
          hasPrayed: !interactionDoc.empty,
          _count: {
            interactions: request.prayerCount,
          },
        }
      })
    )

    return NextResponse.json(requestsWithDetails)
  } catch (error) {
    console.error('Error fetching prayer requests:', error)
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

    const userId = (session.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, content, isAnonymous } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const prayerRequest = await PrayerRequestService.create({
      userId,
      churchId: church.id,
      title,
      content,
      isAnonymous: isAnonymous || false,
      status: 'ACTIVE',
    })

    // Get user data
    const user = await UserService.findById(userId)

    return NextResponse.json({
      ...prayerRequest,
      user: user && !prayerRequest.isAnonymous ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
      } : null,
      _count: {
        interactions: 0,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating prayer request:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

