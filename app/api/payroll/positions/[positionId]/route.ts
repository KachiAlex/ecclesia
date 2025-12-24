
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { PayrollPositionService, WageScaleService, SalaryService } from '@/lib/services/payroll-service'
import { UserService } from '@/lib/services/user-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { guardApi } from '@/lib/api-guard'

export async function GET(
  request: Request,
  { params }: { params: { positionId: string } }
) {
  try {
    const { positionId } = params
    const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'PASTOR', 'SUPER_ADMIN'] })
    if (!guarded.ok) return guarded.response

    const { church } = guarded.ctx

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
    const { positionId } = params
    const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'PASTOR', 'SUPER_ADMIN'] })
    if (!guarded.ok) return guarded.response

    const { church } = guarded.ctx

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
    const { positionId } = params
    const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'PASTOR', 'SUPER_ADMIN'] })
    if (!guarded.ok) return guarded.response

    const { church } = guarded.ctx

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
