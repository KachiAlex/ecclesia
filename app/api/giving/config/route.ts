
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import { GivingConfigService } from '@/lib/services/giving-config-service'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const config = await GivingConfigService.findByChurch(church.id)
    return NextResponse.json(config)
  } catch (error: any) {
    console.error('Error fetching giving config:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
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

    const body = await request.json()
    
    // Check if config already exists
    const existing = await GivingConfigService.findByChurch(church.id)

    const mergedBody = (() => {
      if (!existing) return body

      const incomingFw = body?.paymentMethods?.flutterwave
      const existingFw = (existing as any)?.paymentMethods?.flutterwave

      if (!incomingFw) return body

      const isMasked = (v: any) => typeof v === 'string' && v.trim() === '********'
      const isEmpty = (v: any) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '')

      const mergedFw = {
        ...existingFw,
        ...incomingFw,
      }

      if (isMasked(incomingFw.publicKey) || isEmpty(incomingFw.publicKey)) {
        if (existingFw?.publicKey) mergedFw.publicKey = existingFw.publicKey
      }
      if (isMasked(incomingFw.secretKey) || isEmpty(incomingFw.secretKey)) {
        if (existingFw?.secretKey) mergedFw.secretKey = existingFw.secretKey
      }
      if (isMasked(incomingFw.webhookSecretHash) || isEmpty(incomingFw.webhookSecretHash)) {
        if (existingFw?.webhookSecretHash) mergedFw.webhookSecretHash = existingFw.webhookSecretHash
      }

      return {
        ...body,
        paymentMethods: {
          ...(body.paymentMethods || {}),
          flutterwave: mergedFw,
        },
      }
    })()

    let config
    if (existing) {
      // Update existing config
      config = await GivingConfigService.update(existing.id, mergedBody)
    } else {
      // Create new config
      config = await GivingConfigService.create({
        ...mergedBody,
        churchId: church.id,
      })
    }

    return NextResponse.json(config)
  } catch (error: any) {
    console.error('Error saving giving config:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
