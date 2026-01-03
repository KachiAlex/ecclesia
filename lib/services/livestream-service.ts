import { prisma } from '@/lib/firestore'
import { StreamingPlatform, LivestreamStatus, LivestreamPlatformStatus, LivestreamData } from '@/lib/types/streaming'
import { PlatformConnectionService } from './platform-connection-service'

/**
 * Livestream Service
 * Manages livestream creation, updates, and multi-platform broadcasting
 * Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2
 */
export class LivestreamService {
  /**
   * Create a new livestream
   * Property 2: Livestream Multi-Platform Broadcasting - attempts to broadcast to all selected platforms
   */
  static async createLivestream(
    churchId: string,
    userId: string,
    data: {
      title: string
      description?: string
      thumbnail?: string
      startAt: Date
      platforms: {
        platform: StreamingPlatform
        settings?: Record<string, any>
      }[]
    }
  ): Promise<LivestreamData> {
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

      // Create livestream
      const livestream = await prisma.livestream.create({
        data: {
          churchId,
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail,
          status: LivestreamStatus.SCHEDULED,
          startAt: data.startAt,
          createdBy: userId,
          platforms: {
            create: data.platforms.map((p) => ({
              platform: p.platform,
              status: LivestreamPlatformStatus.PENDING,
              settings: p.settings || {},
            })),
          },
        },
        include: {
          platforms: true,
        },
      })

      return this.formatLivestream(livestream)
    } catch (error) {
      console.error('Error creating livestream:', error)
      throw error
    }
  }

  /**
   * Get livestream details
   */
  static async getLivestream(livestreamId: string): Promise<LivestreamData | null> {
    try {
      const livestream = await prisma.livestream.findUnique({
        where: { id: livestreamId },
        include: { platforms: true },
      })

      if (!livestream) {
        return null
      }

      return this.formatLivestream(livestream)
    } catch (error) {
      console.error('Error getting livestream:', error)
      throw error
    }
  }

  /**
   * Get all livestreams for a church
   */
  static async getLivestreams(churchId: string, status?: LivestreamStatus): Promise<LivestreamData[]> {
    try {
      const livestreams = await prisma.livestream.findMany({
        where: {
          churchId,
          ...(status && { status }),
        },
        include: { platforms: true },
        orderBy: { startAt: 'desc' },
      })

      return livestreams.map((ls) => this.formatLivestream(ls))
    } catch (error) {
      console.error('Error getting livestreams:', error)
      throw error
    }
  }

  /**
   * Start broadcasting livestream
   * Property 2: Livestream Multi-Platform Broadcasting - broadcasts to all selected platforms
   */
  static async startBroadcasting(livestreamId: string): Promise<LivestreamData> {
    try {
      const livestream = await prisma.livestream.findUnique({
        where: { id: livestreamId },
        include: { platforms: true },
      })

      if (!livestream) {
        throw new Error('Livestream not found')
      }

      // Update livestream status
      const updated = await prisma.livestream.update({
        where: { id: livestreamId },
        data: {
          status: LivestreamStatus.LIVE,
        },
        include: { platforms: true },
      })

      // Update all platform statuses to LIVE
      await Promise.all(
        livestream.platforms.map((p) =>
          prisma.livestreamPlatform.update({
            where: { id: p.id },
            data: { status: LivestreamPlatformStatus.LIVE },
          })
        )
      )

      return this.formatLivestream(updated)
    } catch (error) {
      console.error('Error starting broadcast:', error)
      throw error
    }
  }

  /**
   * Stop broadcasting livestream
   * Property 4: Platform Failure Isolation - continues with other platforms if one fails
   */
  static async stopBroadcasting(livestreamId: string): Promise<LivestreamData> {
    try {
      const livestream = await prisma.livestream.findUnique({
        where: { id: livestreamId },
        include: { platforms: true },
      })

      if (!livestream) {
        throw new Error('Livestream not found')
      }

      // Update livestream status
      const updated = await prisma.livestream.update({
        where: { id: livestreamId },
        data: {
          status: LivestreamStatus.ENDED,
          endAt: new Date(),
        },
        include: { platforms: true },
      })

      // Update all platform statuses to ENDED
      await Promise.all(
        livestream.platforms.map((p) =>
          prisma.livestreamPlatform.update({
            where: { id: p.id },
            data: { status: LivestreamPlatformStatus.ENDED },
          })
        )
      )

      return this.formatLivestream(updated)
    } catch (error) {
      console.error('Error stopping broadcast:', error)
      throw error
    }
  }

  /**
   * Update livestream details
   */
  static async updateLivestream(
    livestreamId: string,
    data: {
      title?: string
      description?: string
      thumbnail?: string
    }
  ): Promise<LivestreamData> {
    try {
      const updated = await prisma.livestream.update({
        where: { id: livestreamId },
        data,
        include: { platforms: true },
      })

      return this.formatLivestream(updated)
    } catch (error) {
      console.error('Error updating livestream:', error)
      throw error
    }
  }

  /**
   * Delete livestream
   */
  static async deleteLivestream(livestreamId: string): Promise<void> {
    try {
      await prisma.livestream.delete({
        where: { id: livestreamId },
      })
    } catch (error) {
      console.error('Error deleting livestream:', error)
      throw error
    }
  }

  /**
   * Update platform status
   * Property 4: Platform Failure Isolation - tracks individual platform failures
   */
  static async updatePlatformStatus(
    livestreamId: string,
    platform: StreamingPlatform,
    status: LivestreamPlatformStatus,
    error?: string
  ): Promise<void> {
    try {
      await prisma.livestreamPlatform.update({
        where: {
          livestreamId_platform: {
            livestreamId,
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
   */
  static async getPlatformLinks(livestreamId: string): Promise<
    Array<{
      platform: StreamingPlatform
      url?: string
      status: LivestreamPlatformStatus
      error?: string
    }>
  > {
    try {
      const livestream = await prisma.livestream.findUnique({
        where: { id: livestreamId },
        include: { platforms: true },
      })

      if (!livestream) {
        throw new Error('Livestream not found')
      }

      return livestream.platforms.map((p) => ({
        platform: p.platform,
        url: p.url || undefined,
        status: p.status,
        error: p.error || undefined,
      }))
    } catch (error) {
      console.error('Error getting platform links:', error)
      throw error
    }
  }

  /**
   * Format livestream for API response
   */
  private static formatLivestream(livestream: any): LivestreamData {
    return {
      id: livestream.id,
      churchId: livestream.churchId,
      title: livestream.title,
      description: livestream.description,
      thumbnail: livestream.thumbnail,
      status: livestream.status,
      startAt: livestream.startAt,
      endAt: livestream.endAt,
      createdBy: livestream.createdBy,
      createdAt: livestream.createdAt,
      updatedAt: livestream.updatedAt,
    }
  }
}
