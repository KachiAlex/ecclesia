import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { ReadingResourceCategoryService } from '@/lib/services/reading-plan-day-service'

export async function GET() {
  try {
    const guard = await guardApi()
    if (!guard.ok) return guard.response

    const categories = await ReadingResourceCategoryService.listAll()
    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error('Error fetching resource categories:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const guard = await guardApi({
      allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PASTOR'],
    })
    if (!guard.ok) return guard.response

    const body = await request.json()
    const { name, description, color, icon } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const category = await ReadingResourceCategoryService.create({
      name,
      description,
      color,
      icon,
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating resource category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    )
  }
}
