import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { guardApi } from '@/lib/api-guard'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { StorageService } from '@/lib/services/storage-service'

type RouteParams = {
  params: {
    churchId: string
  }
}

const ALLOWED_ROLES = ['PASTOR', 'ADMIN', 'SUPER_ADMIN']

const formatSignaturePayload = (churchData: FirebaseFirestore.DocumentData | undefined) => ({
  signatureUrl: churchData?.certificateSignatureUrl || null,
  signatureTitle: churchData?.certificateSignatureTitle || 'Lead Pastor',
  signatureName: churchData?.certificateSignatureName || churchData?.name || '',
})

async function ensureGuardedAccess(params: RouteParams['params']) {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return { guarded, errorResponse: guarded.response }

  const churchId = guarded.ctx.church?.id
  if (churchId !== params.churchId && guarded.ctx.role !== 'SUPER_ADMIN') {
    return {
      guarded,
      errorResponse: NextResponse.json({ error: 'Access denied' }, { status: 403 }),
    }
  }

  return { guarded }
}

export async function GET(_: NextRequest, { params }: RouteParams) {
  try {
    const { guarded, errorResponse } = await ensureGuardedAccess(params)
    if (!guarded) return errorResponse!

    const churchDoc = await db.collection(COLLECTIONS.churches).doc(params.churchId).get()
    if (!churchDoc.exists) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 })
    }

    return NextResponse.json(formatSignaturePayload(churchDoc.data()))
  } catch (error) {
    console.error('Certificate signature GET error:', error)
    return NextResponse.json({ error: 'Failed to load signature settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { guarded, errorResponse } = await ensureGuardedAccess(params)
    if (!guarded) return errorResponse!

    if (!ALLOWED_ROLES.includes(guarded.ctx.role || '')) {
      return NextResponse.json({ error: 'Only pastors and admins can upload signatures' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = (formData.get('signature') || formData.get('file')) as File | null
    const title = (formData.get('title') as string | null)?.trim() || 'Lead Pastor'
    const name = (formData.get('name') as string | null)?.trim() || guarded.ctx.church?.name || ''

    if (!file) {
      return NextResponse.json({ error: 'Signature image is required' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Signature must be smaller than 2MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const extension = file.name.split('.').pop() || 'png'
    const upload = await StorageService.uploadFile({
      file: buffer,
      fileName: `certificate-signature-${Date.now()}.${extension}`,
      folder: `churches/${params.churchId}/certificate-signatures`,
      userId: guarded.ctx.userId,
      churchId: params.churchId,
      contentType: file.type,
    })

    const churchRef = db.collection(COLLECTIONS.churches).doc(params.churchId)
    await churchRef.update({
      certificateSignatureUrl: upload.url,
      certificateSignatureTitle: title,
      certificateSignatureName: name,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      signatureUrl: upload.url,
      signatureTitle: title,
      signatureName: name,
    })
  } catch (error) {
    console.error('Certificate signature POST error:', error)
    return NextResponse.json({ error: 'Failed to update signature image' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { guarded, errorResponse } = await ensureGuardedAccess(params)
    if (!guarded) return errorResponse!

    if (!ALLOWED_ROLES.includes(guarded.ctx.role || '')) {
      return NextResponse.json({ error: 'Only pastors and admins can update signature settings' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const title = body?.title?.trim()
    const name = body?.name?.trim()

    if (!title) {
      return NextResponse.json({ error: 'Signature title is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      certificateSignatureTitle: title,
      updatedAt: FieldValue.serverTimestamp(),
    }
    if (typeof name === 'string') {
      updateData.certificateSignatureName = name
    }

    const churchRef = db.collection(COLLECTIONS.churches).doc(params.churchId)
    await churchRef.update(updateData)

    const updatedDoc = await churchRef.get()

    return NextResponse.json(formatSignaturePayload(updatedDoc.data()))
  } catch (error) {
    console.error('Certificate signature PUT error:', error)
    return NextResponse.json({ error: 'Failed to update signature settings' }, { status: 500 })
  }
}