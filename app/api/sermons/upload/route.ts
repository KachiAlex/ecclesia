import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import { storage } from '@/lib/firestore'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (!['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const userId = (session.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as 'video' | 'audio' | 'thumbnail'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes: Record<string, string[]> = {
      video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-matroska'],
      audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-m4a'],
      thumbnail: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    }

    if (!validTypes[type]?.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type for ${type}. Received: ${file.type}` },
        { status: 400 }
      )
    }

    // Check file size (max 500MB for video, 100MB for audio, 5MB for thumbnail)
    const maxSizes: Record<string, number> = {
      video: 500 * 1024 * 1024, // 500MB
      audio: 100 * 1024 * 1024, // 100MB
      thumbnail: 5 * 1024 * 1024, // 5MB
    }

    if (file.size > maxSizes[type]) {
      return NextResponse.json(
        { error: `File too large. Maximum size for ${type} is ${maxSizes[type] / (1024 * 1024)}MB` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    const filePath = `sermons/${church.id}/${type}/${fileName}`

    // Get bucket
    const bucket = storage.bucket()
    const fileUpload = bucket.file(filePath)

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload file with metadata
    await fileUpload.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(), // For public access
          uploadedBy: userId,
          churchId: church.id,
          originalName: file.name,
        },
      },
    })

    // Make file publicly accessible
    await fileUpload.makePublic()

    // Return public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      fileSize: file.size,
      fileType: file.type,
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

