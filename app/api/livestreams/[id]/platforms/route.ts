import { NextRequest, NextResponse } from 'next/server'
import { LivestreamService } from '@/lib/services/livestream-service'

/**
 * GET /api/livestreams/[id]/platforms - Get platform links for members
 * Requirements: 5.1, 5.2, 5.3
 * Property 5: Member Platform Access
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const links = await LivestreamService.getPlatformLinks(params.id)

    return NextResponse.json({
      success: true,
      data: links,
    })
  } catch (error) {
    console.error('Error fetching platform links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform links' },
      { status: 500 }
    )
  }
}
