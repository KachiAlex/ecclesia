import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { CommentService } from '@/lib/services/comment-service'
import { UserService } from '@/lib/services/user-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function GET(
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

    const comments = await CommentService.findByPost(postId)

    // Get user data + like status/count for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await UserService.findById(comment.userId)

        const likeDoc = await db
          .collection(COLLECTIONS.comments)
          .doc(comment.id)
          .collection('likes')
          .doc(userId)
          .get()

        const likesCountSnap = await db
          .collection(COLLECTIONS.comments)
          .doc(comment.id)
          .collection('likes')
          .count()
          .get()

        return {
          ...comment,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImage: user.profileImage,
          } : null,
          isLiked: likeDoc.exists,
          _count: {
            likes: likesCountSnap.data().count || 0,
          },
        }
      })
    )

    return NextResponse.json(commentsWithUsers)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const body = await request.json()
    const { content, parentCommentId } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const comment = await CommentService.create({
      userId,
      postId,
      content,
      parentCommentId: parentCommentId ? String(parentCommentId) : undefined,
    })

    // Get user data
    const user = await UserService.findById(userId)

    return NextResponse.json({
      ...comment,
      user: user ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
      } : null,
      isLiked: false,
      _count: {
        likes: 0,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

