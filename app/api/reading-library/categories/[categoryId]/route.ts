import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { ReadingResourceCategoryService } from '@/lib/services/reading-plan-day-service'

type RouteParams = {
  categoryId: string
}

export async function GET(request: Request, { params }: { params: RouteParams }) {
  try {
    const guard = await guardApi()
    if (!guard.ok) return guard.response

    const category = await ReadingResourceCategoryService.update(params.categoryId, {})
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error('Error loading resource category:', error)
    return NextResponse.json({ error: error.message || 'Failed to load category' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: RouteParams }) {
  try {
    const guard = await guardApi({
      allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PASTOR'],
    })
    if (!guard.ok) return guard.response

    const body = await request.json()
    const { name, description, color, icon } = body

    const updated = await ReadingResourceCategoryService.update(params.categoryId, {
      name,
      description,
      color,
      icon,
    })

    if (!updated) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ category: updated })
  } catch (error: any) {
    console.error('Error updating resource category:', error)
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: RouteParams }) {
  try {
    const guard = await guardApi({
      allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PASTOR'],
    })
    if (!guard.ok) return guard.response

    await ReadingResourceCategoryService.delete(params.categoryId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting resource category:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 })
  }
}
