import { NextResponse } from 'next/server'
import { ChurchService } from '@/lib/services/church-service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: 'Church slug is required' },
        { status: 400 }
      )
    }

    const church = await ChurchService.findBySlug(slug)

    if (!church) {
      return NextResponse.json(
        { error: 'Church not found' },
        { status: 404 }
      )
    }

    // Return church without sensitive data
    return NextResponse.json({
      church: {
        id: church.id,
        name: church.name,
        slug: church.slug,
        city: church.city,
        country: church.country,
      },
    })
  } catch (error) {
    console.error('Error fetching church by slug:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

