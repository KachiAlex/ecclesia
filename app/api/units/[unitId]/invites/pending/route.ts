import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { UnitMembershipService, UnitService } from '@/lib/services/unit-service'

export async function GET(_: Request, { params }: { params: { unitId: string } }) {
  const guarded = await guardApi({ requireChurch: true })
  if (!guarded.ok) return guarded.response

  const { church, userId } = guarded.ctx
  const unit = await UnitService.findById(params.unitId)
  if (!unit || unit.churchId !== church!.id) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
  }

  const membership = await UnitMembershipService.findByUserAndUnit(userId, unit.id)
  if (!membership || membership.role !== 'HEAD') {
    return NextResponse.json({ error: 'Only unit heads can view pending invites' }, { status: 403 })
  }

  const snap = await db
    .collection(COLLECTIONS.unitInvites)
    .where('churchId', '==', church!.id)
    .where('unitId', '==', unit.id)
    .where('status', '==', 'PENDING')
    .limit(200)
    .get()

  const invites = snap.docs.map((doc: any) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      respondedAt: data.respondedAt ? toDate(data.respondedAt) : undefined,
    }
  })

  return NextResponse.json({ invites })
}
