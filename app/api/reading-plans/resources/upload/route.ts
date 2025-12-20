import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { StorageService } from '@/lib/services/storage-service'
import { ReadingPlanResourceService } from '@/lib/services/reading-plan-day-service'

const ALLOWED_BOOK_TYPES = [
  'application/pdf',
  'application/epub+zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: Request) {
  try {
    const guard = await guardApi({
      requireChurch: true,
      allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PASTOR'],
    })
    if (!guard.ok) return guard.response

    const { userId, church } = guard.ctx
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const planId = formData.get('planId')?.toString() || undefined
    const title = formData.get('title')?.toString() || undefined
    const description = formData.get('description')?.toString() || undefined
    const resourceType = (formData.get('type')?.toString() as 'book' | 'pdf' | 'audio' | 'video' | 'link') || 'book'
    const categoryId = formData.get('categoryId')?.toString() || undefined
    const author = formData.get('author')?.toString() || undefined
    const tagsValue = formData.get('tags')?.toString()
    const tags = tagsValue
      ? tagsValue
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : []
    const planIdsValue = formData.get('planIds')?.toString()
    let planIds: string[] | undefined = undefined
    if (planIdsValue) {
      try {
        const parsed = JSON.parse(planIdsValue)
        if (Array.isArray(parsed)) {
          planIds = parsed.filter((id) => typeof id === 'string' && id.trim().length > 0)
        }
      } catch {
        planIds = planIdsValue
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      }
    } else if (planId) {
      planIds = [planId]
    }
    const metadataValue = formData.get('metadata')?.toString()
    let metadata: Record<string, any> | undefined
    if (metadataValue) {
      try {
        metadata = JSON.parse(metadataValue)
      } catch {
        metadata = undefined
      }
    }

    if (!file) {
      return NextResponse.json({ error: 'File upload is required.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
        { status: 400 }
      )
    }

    if (!ALLOWED_BOOK_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || 'unknown'}. Allowed types: PDF, EPUB, DOC, PPT.` },
        { status: 400 }
      )
    }

    const fileName =
      file.name ||
      `reading-resource-${Date.now()}.${file.type.split('/').pop() || 'pdf'}`

    const upload = await StorageService.uploadFile({
      file,
      fileName,
      folder: `reading-plans/resources/${planId || 'shared'}`,
      userId,
      churchId: church?.id,
      contentType: file.type,
    })

    const resource = await ReadingPlanResourceService.create({
      planId,
      planIds,
      title: title || file.name || 'Reading Resource',
      description,
      author,
      categoryId,
      tags,
      type: resourceType,
      fileUrl: upload.url,
      fileName: file.name || fileName,
      filePath: upload.path,
      contentType: file.type,
      size: file.size,
      createdBy: userId,
      metadata,
    })

    return NextResponse.json({ resource }, { status: 201 })
  } catch (error: any) {
    console.error('Error uploading reading resource:', error)
    const message = error.message || 'Failed to upload resource.'
    const status = message.includes('API_BIBLE_KEY') ? 500 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
