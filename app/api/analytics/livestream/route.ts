import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { AnalyticsService } from '@/lib/services/analytics-service'
import { LivestreamAnalytics } from '@/lib/types/analytics'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { churchId, ...livestreamData } = body

    if (!churchId) {
      return NextResponse.json({ error: 'Church ID required' }, { status: 400 })
    }

    const livestreamId = await AnalyticsService.recordLivestream(
      churchId,
      livestreamData as Omit<LivestreamAnalytics, 'livestreamId'>
    )
    return NextResponse.json({ success: true, livestreamId })
  } catch (error) {
    console.error('Livestream analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { churchId, livestreamId, ...updateData } = body

    if (!churchId || !livestreamId) {
      return NextResponse.json({ error: 'Church ID and Livestream ID required' }, { status: 400 })
    }

    await AnalyticsService.updateLivestream(churchId, livestreamId, updateData)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update livestream analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
