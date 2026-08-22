export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UnitService, UnitMembershipService } from '@/lib/services/unit-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'
import { randomBytes } from 'crypto'

interface UnitInviteLink {
  id: string
  unitId: string
  churchId: string
  token: string
  createdByUserId: string
  expiresAt?: Date | null
  maxUses?: number | null
  currentUses: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export async function POST(_: Request, { params }: { params: { unitId: string } }) {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church, userId, role } = guarded.ctx
  const unit = await UnitService.findById(params.unitId)
  if (!unit || unit.churchId !== church.id) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
  }

  const membership = await UnitMembershipService.findByUserAndUnit(userId, unit.id)
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const isHead = membership?.role === 'HEAD'
  
  if (!isAdmin && !isHead) {
    return NextResponse.json({ error: 'Not authorized to create invite links' }, { status: 403 })
  }

  // Generate a unique token
  const token = randomBytes(32).toString('hex')
  
  // Deactivate any existing invite links for this unit
  const existingLinksQuery = await db
    .collection(COLLECTIONS.unitInviteLinks)
    .where('unitId', '==', unit.id)
    .where('active', '==', true)
    .get()
  
  const batch = db.batch()
  existingLinksQuery.docs.forEach(doc => {
    batch.update(doc.ref, { active: false, updatedAt: FieldValue.serverTimestamp() })
  })

  // Create new invite link
  const inviteLinkRef = db.collection(COLLECTIONS.unitInviteLinks).doc()
  const inviteLink = {
    unitId: unit.id,
    churchId: church.id,
    token,
    createdByUserId: userId,
    expiresAt: null, // No expiration for now
    maxUses: null, // No limit for now
    currentUses: 0,
    active: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }
  
  batch.set(inviteLinkRef, inviteLink)
  await batch.commit()

  // Generate the full invite URL
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/invite/unit/${token}`

  return NextResponse.json({ 
    inviteLink: inviteUrl,
    token,
    id: inviteLinkRef.id
  })
}

export async function GET(_: Request, { params }: { params: { unitId: string } }) {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church, userId, role } = guarded.ctx
  const unit = await UnitService.findById(params.unitId)
  if (!unit || unit.churchId !== church.id) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
  }

  const membership = await UnitMembershipService.findByUserAndUnit(userId, unit.id)
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const isHead = membership?.role === 'HEAD'
  
  if (!isAdmin && !isHead) {
    return NextResponse.json({ error: 'Not authorized to view invite links' }, { status: 403 })
  }

  // Get active invite link for this unit
  const inviteLinkQuery = await db
    .collection(COLLECTIONS.unitInviteLinks)
    .where('unitId', '==', unit.id)
    .where('active', '==', true)
    .limit(1)
    .get()

  if (inviteLinkQuery.empty) {
    return NextResponse.json({ inviteLink: null })
  }

  const doc = inviteLinkQuery.docs[0]
  const data = doc.data()
  
  // Generate the full invite URL
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/invite/unit/${data.token}`

  return NextResponse.json({ 
    inviteLink: inviteUrl,
    token: data.token,
    id: doc.id
  })
}