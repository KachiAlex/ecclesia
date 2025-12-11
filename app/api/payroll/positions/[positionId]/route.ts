import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import { requireRole } from '@/lib/auth'
import { PayrollPositionService, WageScaleService, SalaryService } from '@/lib/services/payroll-service'
import { UserService } from '@/lib/services/user-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function GET(
  request: Request,
  { params }: { params: { positionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { positionId } = params
    const userId = (session.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const position = await PayrollPositionService.findById(positionId)

    if (!position || position.churchId !== church.id) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      )
    }

    // Get department
    let department = null
    if (position.departmentId) {
      const deptDoc = await db.collection(COLLECTIONS.departments).doc(position.departmentId).get()
      if (deptDoc.exists) {
        department = { id: deptDoc.id, ...deptDoc.data() }
      }
    }

    // Get wage scales
    const wageScales = await WageScaleService.findByChurch(church.id, positionId)

    // Get active salaries
    const salariesSnapshot = await db.collection(COLLECTIONS.salaries)
      .where('positionId', '==', positionId)
      .get()

    const userSalaries = await Promise.all(
      salariesSnapshot.docs.map(async (doc: any) => {
        const salaryData = doc.data()
        const user = await UserService.findById(salaryData.userId)
        return {
          ...salaryData,
          id: doc.id,
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

    return NextResponse.json({
      ...position,
      department,
      wageScales,
      userSalaries: userSalaries.filter((s: any) => !s.endDate), // Active only
    })
  } catch (error) {
    console.error('Error fetching position:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { positionId: string } }
) {
  try {
    const session = await requireRole(['ADMIN', 'SUPER_ADMIN', 'PASTOR'])
    const { positionId } = params
    const userId = (session.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, description, departmentId, isActive } = body

    const position = await PayrollPositionService.update(positionId, {
      name,
      description,
      departmentId: departmentId || undefined,
      isActive: isActive !== undefined ? isActive : undefined,
    })

    // Get department
    let department = null
    if (position.departmentId) {
      const deptDoc = await db.collection(COLLECTIONS.departments).doc(position.departmentId).get()
      if (deptDoc.exists) {
        department = { id: deptDoc.id, ...deptDoc.data() }
      }
    }

    return NextResponse.json({
      ...position,
      department,
    })
  } catch (error: any) {
    console.error('Error updating position:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { positionId: string } }
) {
  try {
    const session = await requireRole(['ADMIN', 'SUPER_ADMIN', 'PASTOR'])
    const { positionId } = params
    const userId = (session.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    // Check if position has active salaries
    const salariesSnapshot = await db.collection(COLLECTIONS.salaries)
      .where('positionId', '==', positionId)
      .get()

    const activeSalaries = salariesSnapshot.docs.filter((doc: any) => !doc.data().endDate)

    if (activeSalaries.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete position with active employees' },
        { status: 400 }
      )
    }

    await db.collection(COLLECTIONS.payrollPositions).doc(positionId).delete()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting position:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    )
  }
}

