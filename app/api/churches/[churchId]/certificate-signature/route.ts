import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { StorageService } from '@/lib/services/storage-service'
import { prisma } from '@/lib/prisma'

type RouteParams = {
  params: Promise<{
    churchId: string
  }>
}

// Upload signature image
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { churchId } = await params
    const guarded = await guardApi({ 
      requireChurch: true,
      allowedRoles: ['ADMIN', 'PASTOR', 'SUPER_ADMIN']
    })
    if (!guarded.ok) return guarded.response

    // Verify church access
    if (guarded.ctx.church?.id !== churchId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('signature') as File
    const title = formData.get('title') as string
    const name = formData.get('name') as string

    if (!file) {
      return NextResponse.json({ error: 'Signature image is required' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 })
    }

    // Upload signature image
    const buffer = Buffer.from(await file.arrayBuffer())
    const upload = await StorageService.uploadFile({
      file: buffer,
      fileName: `signature-${Date.now()}.${file.name.split('.').pop()}`,
      folder: `churches/${churchId}/certificates`,
      userId: guarded.ctx.userId,
      contentType: file.type,
    })

    // Update church with signature settings
    const updatedChurch = await prisma.church.update({
      where: { id: churchId },
      data: {
        certificateSignatureUrl: upload.url,
        certificateSignatureTitle: title || 'Lead Pastor',
        certificateSignatureName: name || '',
      },
    })

    return NextResponse.json({
      signatureUrl: updatedChurch.certificateSignatureUrl,
      signatureTitle: updatedChurch.certificateSignatureTitle,
      signatureName: updatedChurch.certificateSignatureName,
    })
  } catch (error) {
    console.error('Certificate signature upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload signature' },
      { status: 500 }
    )
  }
}

// Get current signature settings
export async function GET(_: NextRequest, { params }: RouteParams) {
  try {
    const { churchId } = await params
    const guarded = await guardApi({ 
      requireChurch: true,
      allowedRoles: ['ADMIN', 'PASTOR', 'SUPER_ADMIN']
    })
    if (!guarded.ok) return guarded.response

    // Verify church access
    if (guarded.ctx.church?.id !== churchId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: {
        certificateSignatureUrl: true,
        certificateSignatureTitle: true,
        certificateSignatureName: true,
      },
    })

    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 })
    }

    return NextResponse.json({
      signatureUrl: church.certificateSignatureUrl,
      signatureTitle: church.certificateSignatureTitle || 'Lead Pastor',
      signatureName: church.certificateSignatureName || '',
    })
  } catch (error) {
    console.error('Get certificate signature error:', error)
    return NextResponse.json(
      { error: 'Failed to get signature settings' },
      { status: 500 }
    )
  }
}

// Update signature settings without uploading new image
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { churchId } = await params
    const guarded = await guardApi({ 
      requireChurch: true,
      allowedRoles: ['ADMIN', 'PASTOR', 'SUPER_ADMIN']
    })
    if (!guarded.ok) return guarded.response

    // Verify church access
    if (guarded.ctx.church?.id !== churchId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { title, name } = await request.json()

    const updatedChurch = await prisma.church.update({
      where: { id: churchId },
      data: {
        certificateSignatureTitle: title || 'Lead Pastor',
        certificateSignatureName: name || '',
      },
    })

    return NextResponse.json({
      signatureTitle: updatedChurch.certificateSignatureTitle,
      signatureName: updatedChurch.certificateSignatureName,
    })
  } catch (error) {
    console.error('Update certificate signature error:', error)
    return NextResponse.json(
      { error: 'Failed to update signature settings' },
      { status: 500 }
    )
  }
}