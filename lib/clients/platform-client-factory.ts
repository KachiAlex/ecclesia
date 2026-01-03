import { StreamingPlatform } from '@/lib/types/streaming'
import { IPlatformClient } from './platform-client-base'
import { RestreamClient } from './restream-client'
import { ZoomClient } from './zoom-client'
import { TeamsClient } from './teams-client'
import { JitsiClient } from './jitsi-client'
import { PlatformConnectionService } from '@/lib/services/platform-connection-service'

/**
 * Platform Client Factory
 * Creates and manages platform-specific API clients
 * Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2
 */
export class PlatformClientFactory {
  private static clients: Map<string, IPlatformClient> = new Map()

  /**
   * Get or create a platform client
   */
  static async getClient(
    churchId: string,
    platform: StreamingPlatform
  ): Promise<IPlatformClient> {
    const key = `${churchId}:${platform}`

    // Return cached client if available
    if (this.clients.has(key)) {
      return this.clients.get(key)!
    }

    // Create new client
    const client = await this.createClient(churchId, platform)
    this.clients.set(key, client)

    return client
  }

  /**
   * Create a platform-specific client
   */
  private static async createClient(
    churchId: string,
    platform: StreamingPlatform
  ): Promise<IPlatformClient> {
    // Get credentials from platform connection service
    const credentials = await PlatformConnectionService.getDecryptedCredentials(churchId, platform)

    let client: IPlatformClient

    switch (platform) {
      case StreamingPlatform.RESTREAM:
        client = new RestreamClient()
        break

      case StreamingPlatform.ZOOM:
        client = new ZoomClient()
        break

      case StreamingPlatform.TEAMS:
        client = new TeamsClient()
        break

      case StreamingPlatform.JITSI:
        client = new JitsiClient()
        break

      // TODO: Add other platform clients
      case StreamingPlatform.INSTAGRAM:
      case StreamingPlatform.YOUTUBE:
      case StreamingPlatform.FACEBOOK:
      case StreamingPlatform.GOOGLE_MEET:
        throw new Error(`Platform client not yet implemented: ${platform}`)

      default:
        throw new Error(`Unknown platform: ${platform}`)
    }

    // Authenticate client
    await client.authenticate(credentials)

    return client
  }

  /**
   * Clear cached client
   */
  static clearClient(churchId: string, platform: StreamingPlatform): void {
    const key = `${churchId}:${platform}`
    this.clients.delete(key)
  }

  /**
   * Clear all cached clients for a church
   */
  static clearChurchClients(churchId: string): void {
    const keysToDelete: string[] = []

    for (const key of this.clients.keys()) {
      if (key.startsWith(`${churchId}:`)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => this.clients.delete(key))
  }
}
