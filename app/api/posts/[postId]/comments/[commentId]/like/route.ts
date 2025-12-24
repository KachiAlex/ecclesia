
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function POST(
  _: Request,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { postId, commentId } = params

    // Ensure comment belongs to post (lightweight check)
    const commentDoc = await db.collection(COLLECTIONS.comments).doc(commentId).get()
    if (!commentDoc.exists) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }
    const commentData = commentDoc.data() as any
    if (commentData?.postId !== postId) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const likeRef = db.collection(COLLECTIONS.comments).doc(commentId).collection('likes').doc(userId)
    const existing = await likeRef.get()

    if (existing.exists) {
      await likeRef.delete()
      return NextResponse.json({ liked: false })
    }

    await likeRef.set({ userId, createdAt: new Date() })
    return NextResponse.json({ liked: true })
  } catch (error: any) {
    console.error('Error toggling comment like:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
