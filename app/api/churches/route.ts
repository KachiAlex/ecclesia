import { NextResponse } from 'next/server'
import { ChurchService } from '@/lib/services/church-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function GET() {
  try {
    const snapshot = await db.collection(COLLECTIONS.churches)
      .orderBy('name', 'asc')
      .get()

    const churches = snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name,
        slug: data.slug,
        logo: data.logo,
        city: data.city,
        state: data.state,
        country: data.country,
      }
    })

    return NextResponse.json(churches)
  } catch (error) {
    console.error('Error fetching churches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, slug, description, address, city, state, zipCode, country } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingSnapshot = await db.collection(COLLECTIONS.churches)
      .where('slug', '==', slug)
      .limit(1)
      .get()

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { error: 'Church with this slug already exists' },
        { status: 400 }
      )
    }

    const church = await ChurchService.create({
      name,
      slug,
      description,
      address,
      city,
      state,
      zipCode,
      country,
    })

    return NextResponse.json(church, { status: 201 })
  } catch (error) {
    console.error('Error creating church:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

