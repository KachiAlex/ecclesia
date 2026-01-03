import { prisma } from '@/lib/firestore'
import { StreamingPlatform, MeetingStatus, MeetingPlatformStatus, MeetingData } from '@/lib/types/streaming'
import { PlatformConnectionService } from './platform-connection-service'

/**
 * Meeting Service
 * Manages meeting creation, updates, and multi-platform scheduling
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.3
 */
export class MeetingService {
  /**
   * Create a new meeting on multiple platforms
   * Property 3: Meeting Link Generation - generates valid links for each platform
   */
  static async createMeeting(
    churchId: string,
    userId: string,
    data: {
      title: string
      description?: string
      startAt: Date
      endAt: Date
      primaryPlatform?: StreamingPlatform
      platforms: {
        platform: StreamingPlatform
        settings?: Record<string, any>
      }[]
    }
  ): Promise<MeetingData> {
    try {
      // Validate that at least one platform is selected
      if (!data.platforms || data.platforms.length === 0) {
        throw new Error('At least one platform must be selected')
      }

      // Validate that all selected platforms are connected
      const connections = await PlatformConnectionService.getConnections(churchId)
      const connectedPlatforms = connections.map((c) => c.platform)

      for (const platform of data.platforms) {
        if (!connectedPlatforms.includes(platform.platform)) {
          throw new Error(`Platform ${platform.platform} is not connected`)
        }
      }

      // Validate primary platform if specified
      if (data.primaryPlatform && !data.platforms.some((p) => p.platform === data.primaryPlatform)) {
        throw new Error('Primary platform must be one of the selected platforms')
      }

      // Create meeting
      const meeting = await prisma.meeting.create({
        data: {
          churchId,
          title: data.title,
          description: data.description,
          status: MeetingStatus.SCHEDULED,
          startAt: data.startAt,
          endAt: data.endAt,
          primaryPlatform: data.primaryPlatform,
          createdBy: userId,
          platforms: {
            create: data.platforms.map((p) => ({
              platform: p.platform,
              status: MeetingPlatformStatus.PENDING,
              settings: p.settings || {},
            })),
          },
        },
        include: {
          platforms: true,
        },
      })

      return this.formatMeeting(meeting)
    } catch (error) {
      console.error('Error creating meeting:', error)
      throw error
    }
  }

  /**
   * Get meeting details
   */
  static async getMeeting(meetingId: string): Promise<MeetingData | null> {
    try {
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: { platforms: true },
      })

      if (!meeting) {
        return null
      }

      return this.formatMeeting(meeting)
    } catch (error) {
      console.error('Error getting meeting:', error)
      throw error
    }
  }

  /**
   * Get all meetings for a church
   */
  static async getMeetings(churchId: string, status?: MeetingStatus): Promise<MeetingData[]> {
    try {
      const meetings = await prisma.meeting.findMany({
        where: {
          churchId,
          ...(status && { status }),
        },
        include: { platforms: true },
        orderBy: { startAt: 'asc' },
      })

      return meetings.map((m) => this.formatMeeting(m))
    } catch (error) {
      console.error('Error getting meetings:', error)
      throw error
    }
  }

  /**
   * Update meeting details
   */
  static async updateMeeting(
    meetingId: string,
    data: {
      title?: string
      description?: string
      primaryPlatform?: StreamingPlatform
    }
  ): Promise<MeetingData> {
    try {
      const updated = await prisma.meeting.update({
        where: { id: meetingId },
        data,
        include: { platforms: true },
      })

      return this.formatMeeting(updated)
    } catch (error) {
      console.error('Error updating meeting:', error)
      throw error
    }
  }

  /**
   * Delete meeting
   */
  static async deleteMeeting(meetingId: string): Promise<void> {
    try {
      await prisma.meeting.delete({
        where: { id: meetingId },
      })
    } catch (error) {
      console.error('Error deleting meeting:', error)
      throw error
    }
  }

  /**
   * Update meeting status
   */
  static async updateMeetingStatus(meetingId: string, status: MeetingStatus): Promise<MeetingData> {
    try {
      const updated = await prisma.meeting.update({
        where: { id: meetingId },
        data: { status },
        include: { platforms: true },
      })

      return this.formatMeeting(updated)
    } catch (error) {
      console.error('Error updating meeting status:', error)
      throw error
    }
  }

  /**
   * Update platform status
   * Property 4: Platform Failure Isolation - tracks individual platform failures
   */
  static async updatePlatformStatus(
    meetingId: string,
    platform: StreamingPlatform,
    status: MeetingPlatformStatus,
    error?: string
  ): Promise<void> {
    try {
      await prisma.meetingPlatform.update({
        where: {
          meetingId_platform: {
            meetingId,
            platform,
          },
        },
        data: {
          status,
          error: error || null,
        },
      })
    } catch (error) {
      console.error(`Error updating platform status for ${platform}:`, error)
      throw error
    }
  }

  /**
   * Get platform links for members
   * Property 5: Member Platform Access - returns all available platform links
   * Property 8: Primary Platform Highlighting - highlights primary platform
   */
  static async getPlatformLinks(meetingId: string): Promise<
    Array<{
      platform: StreamingPlatform
      url?: string
      status: MeetingPlatformStatus
      error?: string
      isPrimary: boolean
    }>
  > {
    try {
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: { platforms: true },
      })

      if (!meeting) {
        throw new Error('Meeting not found')
      }

      return meeting.platforms.map((p) => ({
        platform: p.platform,
        url: p.url || undefined,
        status: p.status,
        error: p.error || undefined,
        isPrimary: p.platform === meeting.primaryPlatform,
      }))
    } catch (error) {
      console.error('Error getting platform links:', error)
      throw error
    }
  }

  /**
   * Format meeting for API response
   */
  private static formatMeeting(meeting: any): MeetingData {
    return {
      id: meeting.id,
      churchId: meeting.churchId,
      title: meeting.title,
      description: meeting.description,
      status: meeting.status,
      startAt: meeting.startAt,
      endAt: meeting.endAt,
      primaryPlatform: meeting.primaryPlatform,
      createdBy: meeting.createdBy,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    }
  }
}
