
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import { requirePermissionMiddleware } from '@/lib/middleware/rbac'
import { UserService } from '@/lib/services/user-service'
import { MessageService } from '@/lib/services/message-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function POST(request: Request) {
  try {
    const { error: permError } = await requirePermissionMiddleware('send_broadcasts')
    if (permError) {
      return permError
    }

    const session = await getServerSession(authOptions)
    const userId = (session?.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { content, targetRole, targetDepartmentId, targetGroupId } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Get all users in church
    let targetUsers = await UserService.findByChurch(church.id)

    // Filter by role
    if (targetRole) {
      targetUsers = targetUsers.filter(user => user.role === targetRole)
    }

    // Filter by department
    if (targetDepartmentId) {
      const departmentSnapshot = await db.collection(COLLECTIONS.departments).doc(targetDepartmentId).get()
      const department = departmentSnapshot.data()
      if (department?.members) {
        targetUsers = targetUsers.filter(user => department.members.includes(user.id))
      }
    }

    // Filter by group
    if (targetGroupId) {
      const groupSnapshot = await db.collection(COLLECTIONS.groups).doc(targetGroupId).get()
      const group = groupSnapshot.data()
      if (group?.members) {
        targetUsers = targetUsers.filter(user => group.members.includes(user.id))
      }
    }

    // Create broadcast messages (simplified - in production, use push notifications)
    const messages = await Promise.all(
      targetUsers.map((user) =>
        MessageService.create({
          senderId: userId,
          receiverId: user.id,
          content: `[BROADCAST] ${content}`,
        })
      )
    )

    return NextResponse.json({
      success: true,
      sentTo: messages.length,
      messages: messages.length,
    })
  } catch (error: any) {
    console.error('Error broadcasting message:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
