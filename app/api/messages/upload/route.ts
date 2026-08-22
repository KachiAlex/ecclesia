
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { StorageService } from '@/lib/services/storage-service'

const MAX_FILE_SIZE = {
  attachment: 25 * 1024 * 1024, // 25MB
  voice: 15 * 1024 * 1024, // 15MB
}

const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const kind = (formData.get('kind') as 'attachment' | 'voice' | null) || 'attachment'

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    const sizeLimit = MAX_FILE_SIZE[kind] ?? MAX_FILE_SIZE.attachment
    if (file.size > sizeLimit) {
      return NextResponse.json(
        { error: `File is too large. Maximum size is ${Math.round(sizeLimit / (1024 * 1024))}MB.` },
        { status: 400 }
      )
    }

    if (kind === 'voice') {
      if (!file.type.startsWith('audio/')) {
        return NextResponse.json(
          { error: 'Voice notes must be audio files.' },
          { status: 400 }
        )
      }
    } else if (
      !ALLOWED_ATTACHMENT_TYPES.includes(file.type) &&
      !file.type.startsWith('image/') &&
      !file.type.startsWith('audio/')
    ) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      )
    }

    const userId = (session.user as any).id
    const churchId = (session.user as any).churchId

    const fileName =
      file.name ||
      `${kind === 'voice' ? 'voice-note' : 'attachment'}-${Date.now()}.${file.type.split('/')[1] || 'bin'}`

    const upload = await StorageService.uploadFile({
      file,
      fileName,
      folder: kind === 'voice' ? 'messages/voice-notes' : 'messages/attachments',
      userId,
      churchId,
      contentType: file.type,
    })

    return NextResponse.json({
      url: upload.url,
      name: file.name || fileName,
      size: file.size,
      contentType: file.type,
    })
  } catch (error) {
    console.error('Error uploading message file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
