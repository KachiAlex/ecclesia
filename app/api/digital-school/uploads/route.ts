
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { StorageService } from '@/lib/services/storage-service'
import { checkStorageLimitForUpload, incrementUsage } from '@/lib/subscription'
import { UserRole } from '@/types'

type UploadKind = 'moduleAudio' | 'moduleBook' | 'examUpload'

type UploadConfig = {
  folder: string
  allowedTypes: string[]
  maxSizeBytes: number
  label: string
}

const MANAGER_ROLES: UserRole[] = ['ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'SUPER_ADMIN']

const UPLOAD_CONFIGS: Record<UploadKind, UploadConfig> = {
  moduleAudio: {
    folder: 'digital-school/modules/audio',
    allowedTypes: [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'audio/x-m4a',
      'audio/aac',
    ],
    maxSizeBytes: 150 * 1024 * 1024, // 150MB
    label: 'module audio',
  },
  moduleBook: {
    folder: 'digital-school/modules/books',
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/epub+zip',
      'text/plain',
    ],
    maxSizeBytes: 60 * 1024 * 1024, // 60MB
    label: 'module attachment',
  },
  examUpload: {
    folder: 'digital-school/exams/uploads',
    allowedTypes: [
      'text/csv',
      'application/json',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    maxSizeBytes: 20 * 1024 * 1024, // 20MB
    label: 'exam upload',
  },
}

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: MANAGER_ROLES })
    if (!guarded.ok) return guarded.response

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const uploadKind = formData.get('type') as UploadKind | null
    const courseId = formData.get('courseId')?.toString()
    const sectionId = formData.get('sectionId')?.toString()
    const moduleId = formData.get('moduleId')?.toString()

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!uploadKind || !UPLOAD_CONFIGS[uploadKind]) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 })
    }

    const config = UPLOAD_CONFIGS[uploadKind]

    if (!config.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported ${config.label} type: ${file.type || 'unknown'}` },
        { status: 400 },
      )
    }

    if (file.size > config.maxSizeBytes) {
      return NextResponse.json(
        {
          error: `File too large for ${config.label}. Max size is ${Math.round(config.maxSizeBytes / (1024 * 1024))}MB`,
        },
        { status: 400 },
      )
    }

    const churchId = guarded.ctx.church?.id
    const userId = guarded.ctx.userId

    if (!churchId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const storageCheck = await checkStorageLimitForUpload(churchId, file.size)
    if (!storageCheck.allowed) {
      return NextResponse.json(
        {
          error: `Storage limit reached. Upload would exceed plan limit of ${
            storageCheck.limit ?? 'your current tier'
          }GB`,
          limit: storageCheck.limit,
          current: storageCheck.current,
          projected: storageCheck.projected,
        },
        { status: 403 },
      )
    }

    const fileExtension = file.name?.split('.').pop() || 'bin'
    const sanitizedName = file.name?.replace(/[^a-zA-Z0-9._-]/g, '_') || `upload-${Date.now()}.${fileExtension}`
    const folderSuffix = [courseId, sectionId, moduleId].filter(Boolean).join('/')

    const upload = await StorageService.uploadFile({
      file,
      fileName: sanitizedName,
      folder: folderSuffix ? `${config.folder}/${folderSuffix}` : config.folder,
      userId,
      churchId,
      contentType: file.type,
    })

    await incrementUsage(churchId, 'storageUsedGB', file.size / (1024 * 1024 * 1024))

    return NextResponse.json(
      {
        success: true,
        url: upload.url,
        path: upload.path,
        fileName: sanitizedName,
        originalName: file.name,
        size: file.size,
        contentType: file.type,
        metadata: {
          courseId,
          sectionId,
          moduleId,
          type: uploadKind,
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error('DigitalSchool.uploads.POST', error)
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 })
  }
}
