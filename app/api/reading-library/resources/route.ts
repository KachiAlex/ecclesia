import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { ReadingPlanResourceService } from '@/lib/services/reading-plan-day-service'

export async function GET(request: Request) {
  try {
    const guard = await guardApi()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const categoryId = searchParams.get('categoryId') || undefined
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const cursor = searchParams.get('cursor') || undefined

    const result = await ReadingPlanResourceService.listAll({
      search,
      categoryId,
      limit: Number.isFinite(limit) ? limit : 20,
      cursor,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching reading resources:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resources' },
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
    const {
      title,
      description,
      author,
      categoryId,
      tags,
      type,
      fileUrl,
      fileName,
      filePath,
      contentType,
      size,
      planIds,
      metadata,
    } = body

    if (!title || !fileUrl) {
      return NextResponse.json({ error: 'Title and fileUrl are required.' }, { status: 400 })
    }

    const resource = await ReadingPlanResourceService.create({
      title,
      description,
      author,
      categoryId,
      tags,
      type: type || 'book',
      fileUrl,
      fileName,
      filePath,
      contentType,
      size,
      createdBy: guard.ctx.userId,
      planIds,
      metadata,
    })

    return NextResponse.json({ resource }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating reading resource:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create resource' },
      { status: 500 }
    )
  }
}
