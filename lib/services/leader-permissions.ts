import { UnitMembershipService } from './unit-service'

/**
 * Check if a leader has permission to manage a specific unit
 */
export async function canLeaderManageUnit(userId: string, unitId: string): Promise<boolean> {
  try {
    const membership = await UnitMembershipService.findByUserAndUnit(userId, unitId)
    return membership?.role === 'HEAD'
  } catch (error) {
    console.error('Error checking leader unit permissions:', error)
    return false
  }
}

/**
 * Get all units where the user is a leader (HEAD)
 */
export async function getLeaderUnits(userId: string): Promise<string[]> {
  try {
    const memberships = await UnitMembershipService.findByUser(userId)
    return memberships
      .filter(membership => membership.role === 'HEAD')
      .map(membership => membership.unitId)
  } catch (error) {
    console.error('Error getting leader units:', error)
    return []
  }
}

/**
 * Check if a leader can view/manage a specific user (within their units)
 */
export async function canLeaderManageUser(leaderId: string, targetUserId: string): Promise<boolean> {
  try {
    const leaderUnits = await getLeaderUnits(leaderId)
    if (leaderUnits.length === 0) return false

    // Check if target user is in any of the leader's units
    const targetMemberships = await UnitMembershipService.findByUser(targetUserId)
    return targetMemberships.some(membership => 
      leaderUnits.includes(membership.unitId)
    )
  } catch (error) {
    console.error('Error checking leader user permissions:', error)
    return false
  }
}

/**
 * Get users that a leader can manage (members of their units)
 */
export async function getLeaderManagedUsers(leaderId: string): Promise<string[]> {
  try {
    const leaderUnits = await getLeaderUnits(leaderId)
    if (leaderUnits.length === 0) return []

    const allMemberships = await Promise.all(
      leaderUnits.map(unitId => UnitMembershipService.findByUnit(unitId))
    )

    const userIds = new Set<string>()
    allMemberships.flat().forEach(membership => {
      userIds.add(membership.userId)
    })

    return Array.from(userIds)
  } catch (error) {
    console.error('Error getting leader managed users:', error)
    return []
  }
}