import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { ChurchService } from '@/lib/services/church-service'
import { getCurrentChurchId } from '@/lib/church-context'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const churchId = await getCurrentChurchId(userId)

    if (!churchId) {
      return NextResponse.json(
        { error: 'Church not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { churchName, churchCity, churchCountry, address, phone, description, website, denomination } = body

    // Build description with denomination if provided
    let finalDescription = description
    if (denomination && description) {
      finalDescription = `${description}\n\nDenomination: ${denomination}`
    } else if (denomination) {
      finalDescription = `Denomination: ${denomination}`
    }

    // Update church with onboarding data
    await ChurchService.update(churchId, {
      name: churchName || undefined,
      city: churchCity || undefined,
      country: churchCountry || undefined,
      address: address || undefined,
      phone: phone || undefined,
      description: finalDescription || undefined,
      website: website || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

