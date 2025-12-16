import { NextResponse } from 'next/server'
import { TaskService } from '@/lib/services/volunteer-service'
import { UserService } from '@/lib/services/user-service'
import { guardApi } from '@/lib/api-guard'
import { hasPermission } from '@/lib/permissions'

export async function GET(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { role, church } = guarded.ctx

    if (!role || !hasPermission(role, 'manage_volunteers')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const userIdParam = searchParams.get('userId') || undefined

    const tasks = await TaskService.findByChurch(church.id, status, userIdParam)

    // Add user info to tasks
    const tasksWithUsers = await Promise.all(
      tasks.map(async (task) => {
        const user = await UserService.findById(task.userId)
        return {
          ...task,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profileImage: user.profileImage,
          } : null,
        }
      })
    )

    return NextResponse.json(tasksWithUsers)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { role, church } = guarded.ctx

    if (!role || !hasPermission(role, 'manage_volunteers')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      userId: assignUserId,
      title,
      description,
      departmentId,
      dueDate,
      priority,
    } = body

    if (!assignUserId || !title) {
      return NextResponse.json(
        { error: 'User ID and title are required' },
        { status: 400 }
      )
    }

    const task = await TaskService.create({
      userId: assignUserId,
      title,
      description: description || undefined,
      departmentId: departmentId || undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority || 'Medium',
      status: 'Pending',
    })

    // Add user info
    const user = await UserService.findById(assignUserId)
    const taskWithUser = {
      ...task,
      user: user ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      } : null,
    }

    return NextResponse.json(taskWithUser, { status: 201 })
  } catch (error: any) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

