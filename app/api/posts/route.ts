import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { PostService } from '@/lib/services/post-service'
import { UserService } from '@/lib/services/user-service'
import { getCurrentChurch } from '@/lib/church-context'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get posts
    let posts = await PostService.findByChurch(church.id, limit)
    
    // Filter by type if provided
    if (type) {
      posts = posts.filter(post => post.type === type)
    }

    // Get user data and like status for each post
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const user = await UserService.findById(post.userId)
        
        // Check if user liked this post
        const likeDoc = await db.collection(COLLECTIONS.posts)
          .doc(post.id)
          .collection('likes')
          .doc(userId)
          .get()
        
        // Get comment count
        const commentsSnapshot = await db.collection(COLLECTIONS.comments)
          .where('postId', '==', post.id)
          .count()
          .get()

        return {
          ...post,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImage: user.profileImage,
          } : null,
          isLiked: likeDoc.exists,
          _count: {
            likes: post.likes,
            comments: commentsSnapshot.data().count || 0,
          },
        }
      })
    )

    // Get total count (approximate for pagination)
    const totalSnapshot = await db.collection(COLLECTIONS.posts)
      .where('churchId', '==', church.id)
      .count()
      .get()
    const total = totalSnapshot.data().count || posts.length

    return NextResponse.json({
      posts: postsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

    const userId = (session.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { content, type, images } = body

    if (!content || !type) {
      return NextResponse.json(
        { error: 'Content and type are required' },
        { status: 400 }
      )
    }

    const post = await PostService.create({
      userId,
      churchId: church.id,
      content,
      type,
      imageUrl: images && images.length > 0 ? images[0] : undefined,
    })

    // Get user data
    const user = await UserService.findById(userId)

    return NextResponse.json({
      ...post,
      user: user ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
      } : null,
      _count: {
        likes: 0,
        comments: 0,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}



