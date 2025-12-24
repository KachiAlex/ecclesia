
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import { GroupService } from '@/lib/services/group-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

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
    const latitude = parseFloat(searchParams.get('latitude') || '0')
    const longitude = parseFloat(searchParams.get('longitude') || '0')
    const maxDistance = parseFloat(searchParams.get('maxDistance') || '10') // km

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Get all groups for the church
    const groups = await GroupService.findByChurch(church.id)
    const groupsWithLocation = groups.filter(g => g.latitude && g.longitude)

    // Calculate distances and filter
    const groupsWithDistance = await Promise.all(
      groupsWithLocation.map(async (group) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          group.latitude!,
          group.longitude!
        )

        // Get member count
        const membersSnapshot = await db.collection(COLLECTIONS.groupMemberships)
          .where('groupId', '==', group.id)
          .count()
          .get()

        // Get department info if exists
        let department = null
        if (group.departmentId) {
          const deptDoc = await db.collection(COLLECTIONS.departments).doc(group.departmentId).get()
          if (deptDoc.exists) {
            const deptData = deptDoc.data()!
            department = {
              id: deptDoc.id,
              name: deptData.name,
            }
          }
        }

        return {
          ...group,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          _count: {
            members: membersSnapshot.data().count || 0,
          },
          department,
        }
      })
    )
    const groupsWithDistanceFiltered = groupsWithDistance
      .filter((g) => g.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)

    return NextResponse.json(groupsWithDistanceFiltered)
  } catch (error) {
    console.error('Error finding nearby groups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
