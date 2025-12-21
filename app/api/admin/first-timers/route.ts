import { NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { guardApi } from '@/lib/api-guard'
import { hasPermission } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { role, church } = guarded.ctx

    if (!role || !hasPermission(role, 'view_analytics')) {
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

    // Get first-timers (visitors who joined in last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    const allUsers = await UserService.findByChurch(church.id)
    const firstTimers = allUsers
      .filter(user => 
        user.role === 'VISITOR' && 
        new Date(user.createdAt) >= ninetyDaysAgo
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Categorize first-timers
    const categorized = await Promise.all(
      firstTimers.map(async (user) => {
        const daysSinceJoined = Math.floor(
          (Date.now() - new Date(user.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )

        // Get counts
        const [eventsAttended, sermonsWatched, giving, followUps, mentorAssignments] = await Promise.all([
          db.collection(COLLECTIONS.eventAttendances).where('userId', '==', user.id).count().get(),
          db.collection(COLLECTIONS.sermonViews).where('userId', '==', user.id).count().get(),
          db.collection(COLLECTIONS.giving).where('userId', '==', user.id).count().get(),
          db.collection(COLLECTIONS.followUps).where('userId', '==', user.id).count().get(),
          db.collection(COLLECTIONS.mentorAssignments)
            .where('menteeId', '==', user.id)
            .where('status', '==', 'Active')
            .get(),
        ])

        const hasMentor = mentorAssignments.size > 0
        const hasActivity =
          (eventsAttended.data().count || 0) > 0 ||
          (sermonsWatched.data().count || 0) > 0 ||
          (giving.data().count || 0) > 0

        // Get mentor info if exists
        let mentorAssignmentsData = []
        if (hasMentor) {
          for (const assignment of mentorAssignments.docs) {
            const assignmentData = assignment.data()
            const mentor = await UserService.findById(assignmentData.mentorId)
            if (mentor) {
              mentorAssignmentsData.push({
                mentor: {
                  id: mentor.id,
                  firstName: mentor.firstName,
                  lastName: mentor.lastName,
                  email: mentor.email,
                },
              })
            }
          }
        }

        return {
          ...user,
          daysSinceJoined,
          hasMentor,
          hasActivity,
          status:
            (followUps.data().count || 0) === 0
              ? 'NEEDS_FOLLOWUP'
              : hasMentor && hasActivity
              ? 'ENGAGED'
              : hasMentor
              ? 'ASSIGNED'
              : 'NEW',
          _count: {
            eventsAttended: eventsAttended.data().count || 0,
            sermonsWatched: sermonsWatched.data().count || 0,
            giving: giving.data().count || 0,
            followUps: followUps.data().count || 0,
          },
          mentorAssignments: mentorAssignmentsData,
        }
      })
    )

    return NextResponse.json({
      firstTimers: categorized,
      summary: {
        total: categorized.length,
        new: categorized.filter((u) => u.status === 'NEW').length,
        needsFollowup: categorized.filter((u) => u.status === 'NEEDS_FOLLOWUP').length,
        assigned: categorized.filter((u) => u.status === 'ASSIGNED').length,
        engaged: categorized.filter((u) => u.status === 'ENGAGED').length,
      },
    })
  } catch (error) {
    console.error('Error fetching first-timers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

