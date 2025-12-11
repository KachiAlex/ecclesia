import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import { requireRole } from '@/lib/auth'
import { SalaryService, PayrollPositionService, WageScaleService } from '@/lib/services/payroll-service'
import { UserService } from '@/lib/services/user-service'
import { db, FieldValue } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const currentUserId = (session.user as any).id
    const church = await getCurrentChurch(currentUserId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    // Get all users in church
    const allUsers = await UserService.findByChurch(church.id)
    const targetUserIds = userId ? [userId] : allUsers.map(u => u.id)

    // Get salaries for these users
    let allSalaries: any[] = []
    for (const targetUserId of targetUserIds) {
      const userSalaries = await SalaryService.findByUser(targetUserId)
      allSalaries.push(...userSalaries.map(s => ({ ...s, userId: targetUserId })))
    }

    // Filter by active if needed
    if (activeOnly) {
      allSalaries = allSalaries.filter(s => !s.endDate)
    }

    // Add user, position, and wage scale info
    const salariesWithDetails = await Promise.all(
      allSalaries.map(async (salary) => {
        const [user, position, wageScale] = await Promise.all([
          UserService.findById(salary.userId),
          PayrollPositionService.findById(salary.positionId),
          db.collection(COLLECTIONS.wageScales).doc(salary.wageScaleId).get(),
        ])

        let department = null
        if (position?.departmentId) {
          const deptDoc = await db.collection(COLLECTIONS.departments).doc(position.departmentId).get()
          if (deptDoc.exists) {
            const deptData = deptDoc.data()!
            department = {
              id: deptDoc.id,
              name: deptData.name,
            }
          }
        }

        return {
          ...salary,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profileImage: user.profileImage,
            role: user.role,
          } : null,
          position: position ? {
            ...position,
            department,
          } : null,
          wageScale: wageScale.exists ? { id: wageScale.id, ...wageScale.data() } : null,
        }
      })
    )

    return NextResponse.json(salariesWithDetails.sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    ))
  } catch (error) {
    console.error('Error fetching salaries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'SUPER_ADMIN', 'PASTOR'])
    const userId = (session.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { userId: assignUserId, positionId, wageScaleId, startDate } = body

    if (!assignUserId || !positionId || !wageScaleId) {
      return NextResponse.json(
        { error: 'User ID, Position ID, and Wage Scale ID are required' },
        { status: 400 }
      )
    }

    // Verify user belongs to church
    const user = await UserService.findById(assignUserId)

    if (!user || user.churchId !== church.id) {
      return NextResponse.json(
        { error: 'User not found or does not belong to this church' },
        { status: 404 }
      )
    }

    // Verify position and wage scale belong to church
    const [position, wageScaleDoc] = await Promise.all([
      PayrollPositionService.findById(positionId),
      db.collection(COLLECTIONS.wageScales).doc(wageScaleId).get(),
    ])

    if (!position || position.churchId !== church.id) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      )
    }

    if (!wageScaleDoc.exists) {
      return NextResponse.json(
        { error: 'Wage scale not found' },
        { status: 404 }
      )
    }

    const wageScale = { id: wageScaleDoc.id, ...wageScaleDoc.data()! }

    // Deactivate any existing active salary
    const existingSalaries = await SalaryService.findByUser(assignUserId)
    for (const existing of existingSalaries) {
      if (!existing.endDate) {
        await db.collection(COLLECTIONS.salaries).doc(existing.id).update({
          endDate: startDate ? new Date(startDate) : new Date(),
          updatedAt: FieldValue.serverTimestamp(),
        })
      }
    }

    // Create new salary assignment
    const salary = await SalaryService.create({
      userId: assignUserId,
      positionId,
      wageScaleId,
      startDate: startDate ? new Date(startDate) : new Date(),
    })

    return NextResponse.json({
      ...salary,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      position,
      wageScale,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating salary:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    )
  }
}

