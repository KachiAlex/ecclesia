import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { PostService } from '@/lib/services/post-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { postId } = params

    // Check if already liked (using subcollection)
    const likeRef = db.collection(COLLECTIONS.posts)
      .doc(postId)
      .collection('likes')
      .doc(userId)
    
    const existing = await likeRef.get()

    if (existing.exists) {
      // Unlike
      await likeRef.delete()
      await PostService.decrementLikes(postId)
      return NextResponse.json({ liked: false })
    } else {
      // Like
      await likeRef.set({
        userId,
        createdAt: new Date(),
      })
      await PostService.incrementLikes(postId)
      return NextResponse.json({ liked: true })
    }
  } catch (error: any) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

