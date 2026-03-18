import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { RecommendationService } from '@/lib/services/recommendation-service'

/**
 * PATCH /api/recommendations/[id]
 * Update recommendation status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { status, actionNotes } = await request.json()

    if (!['pending', 'accepted', 'rejected', 'implemented'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    await RecommendationService.updateRecommendationStatus(
      params.id,
      status,
      actionNotes
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/recommendations/[id] failed:', error)
    return NextResponse.json(
      { error: 'Failed to update recommendation', details: (error as Error).message },
      { status: 500 }
    )
  }
}
