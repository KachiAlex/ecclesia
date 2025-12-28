
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { ChurchService } from '@/lib/services/church-service'
import { UserService } from '@/lib/services/user-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role

    if (role === 'SUPER_ADMIN') {
      const snapshot = await db
        .collection(COLLECTIONS.churches)
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
    }

    const userId = (session.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await UserService.findById(userId)
    if (!user?.churchId) {
      return NextResponse.json([])
    }

    const church = await ChurchService.findById(user.churchId)
    if (!church) {
      return NextResponse.json([])
    }

    return NextResponse.json([
      {
        id: church.id,
        name: church.name,
        slug: church.slug,
        logo: (church as any).logo,
        city: church.city,
        state: (church as any).state,
        country: church.country,
      },
    ])
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
