export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UnitService, UnitMembershipService } from '@/lib/services/unit-service'
import { UnitTypeService } from '@/lib/services/unit-type-service'
import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(_: Request, { params }: { params: { token: string } }) {
  const guarded = await guardApi()
  if (!guarded.ok) return guarded.response

  const { userId } = guarded.ctx

  try {
    // Find the invite link by token
    const inviteLinkQuery = await db
      .collection(COLLECTIONS.unitInviteLinks)
      .where('token', '==', params.token)
      .where('active', '==', true)
      .limit(1)
      .get()

    if (inviteLinkQuery.empty) {
      return NextResponse.json({ error: 'Invite link not found or expired' }, { status: 404 })
    }

    const inviteLinkDoc = inviteLinkQuery.docs[0]
    const inviteLink = inviteLinkDoc.data()

    // Check if expired
    if (inviteLink.expiresAt && toDate(inviteLink.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Invite link has expired' }, { status: 410 })
    }

    // Check usage limits
    if (inviteLink.maxUses && inviteLink.currentUses >= inviteLink.maxUses) {
      return NextResponse.json({ error: 'Invite link has reached its usage limit' }, { status: 410 })
    }

    // Get unit details
    const unit = await UnitService.findById(inviteLink.unitId)
    if (!unit) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMembership = await UnitMembershipService.findByUserAndUnit(userId, unit.id)
    if (existingMembership) {
      return NextResponse.json({ error: 'You are already a member of this group' }, { status: 409 })
    }

    // Check unit type restrictions
    const unitType = await UnitTypeService.findById(unit.unitTypeId)
    if (!unitType) {
      return NextResponse.json({ error: 'Invalid group type' }, { status: 400 })
    }

    if (!unitType.allowMultiplePerUser) {
      const existing = await UnitMembershipService.findByUserAndUnitType(userId, unit.unitTypeId)
      if (existing.length > 0) {
        return NextResponse.json({ error: 'You are already a member of another group of this type' }, { status: 409 })
      }
    }

    // Create membership
    const membership = await UnitMembershipService.create({
      churchId: unit.churchId,
      unitId: unit.id,
      unitTypeId: unit.unitTypeId,
      userId,
      role: 'MEMBER'
    })

    // Update invite link usage count
    await inviteLinkDoc.ref.update({
      currentUses: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp()
    })

    return NextResponse.json({ 
      success: true, 
      unitId: unit.id,
      membership 
    })
  } catch (error) {
    console.error('Error accepting invite:', error)
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 })
  }
}