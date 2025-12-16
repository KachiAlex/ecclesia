import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
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

    const { requestId } = await params

    // Delete the prayer request
    await db.collection(COLLECTIONS.prayerRequests).doc(requestId).delete()

    // Also delete associated interactions
    const interactions = await db
      .collection(COLLECTIONS.prayerInteractions)
      .where('requestId', '==', requestId)
      .get()

    const batch = db.batch()
    interactions.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    await batch.commit()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting prayer request:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

