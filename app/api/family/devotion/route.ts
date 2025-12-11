import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { UserService } from '@/lib/services/user-service'
import { ReadingPlanProgressService } from '@/lib/services/reading-plan-service'
import { ReadingPlanService } from '@/lib/services/reading-plan-service'
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
    const familyId = searchParams.get('familyId') || userId

    // Get all users in church to find family members
    const allUsers = await UserService.findByChurch(church.id)
    const familyMembers = allUsers.filter(user =>
      user.id === familyId || user.parentId === familyId || user.spouseId === familyId
    )

    // Get family member details with reading plans and counts
    const family = await Promise.all(
      familyMembers.map(async (member) => {
        // Get active reading plans
        const activeProgress = await ReadingPlanProgressService.findByUser(member.id)
        const incompleteProgress = activeProgress.filter(p => !p.completed)

        const readingPlans = await Promise.all(
          incompleteProgress.map(async (progress) => {
            const plan = await ReadingPlanService.findById(progress.planId)
            return plan ? {
              id: plan.id,
              title: plan.title,
              duration: plan.duration,
            } : null
          })
        )

        // Get counts
        const [prayerRequestsCount, completedPlansCount] = await Promise.all([
          db.collection(COLLECTIONS.prayerRequests).where('userId', '==', member.id).count().get(),
          db.collection(COLLECTIONS.readingPlanProgress)
            .where('userId', '==', member.id)
            .where('completed', '==', true)
            .count()
            .get(),
        ])

        return {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          profileImage: member.profileImage,
          role: member.role,
          readingPlans: readingPlans.filter(Boolean),
          _count: {
            prayerRequests: prayerRequestsCount.data().count || 0,
            readingPlans: completedPlansCount.data().count || 0,
          },
        }
      })
    )

    // Calculate family progress
    const totalPlans = family.reduce(
      (sum, member) => sum + member.readingPlans.length,
      0
    )
    const completedPlans = family.reduce(
      (sum, member) => sum + member._count.readingPlans,
      0
    )

    return NextResponse.json({
      family,
      stats: {
        totalMembers: family.length,
        activePlans: totalPlans,
        completedPlans,
        totalPrayerRequests: family.reduce(
          (sum, member) => sum + member._count.prayerRequests,
          0
        ),
      },
    })
  } catch (error) {
    console.error('Error fetching family devotion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

