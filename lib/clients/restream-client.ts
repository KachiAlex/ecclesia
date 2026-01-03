import { BasePlatformClient } from './platform-client-base'
import { StreamingPlatform } from '@/lib/types/streaming'

/**
 * Restream API Client
 * Handles multi-platform broadcasting through Restream
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export class RestreamClient extends BasePlatformClient {
  platform = StreamingPlatform.RESTREAM
  private apiBaseUrl = 'https://api.restream.io/v2'

  /**
   * Authenticate with Restream API
   */
  async authenticate(credentials: Record<string, any>): Promise<void> {
    try {
      if (!credentials.accessToken) {
        throw new Error('Restream access token is required')
      }

      this.credentials = credentials

      // Verify token by making a test request
      await this.makeRequest('GET', `${this.apiBaseUrl}/user`, undefined, {
        Authorization: `Bearer ${credentials.accessToken}`,
      })

      console.log('Restream authentication successful')
    } catch (error) {
      console.error('Restream authentication failed:', error)
      throw error
    }
  }

  /**
   * Create a livestream on Restream
   * Property 2: Livestream Multi-Platform Broadcasting
   */
  async createLivestream(data: {
    title: string
    description?: string
    thumbnail?: string
  }): Promise<{
    platformId: string
    url: string
  }> {
    try {
      const response = await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/channels`,
        {
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail,
        },
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )

      return {
        platformId: response.id,
        url: response.url || `https://restream.io/channel/${response.id}`,
      }
    } catch (error) {
      console.error('Error creating Restream livestream:', error)
      throw error
    }
  }

  /**
   * Update livestream on Restream
   */
  async updateLivestream(
    platformId: string,
    data: {
      title?: string
      description?: string
      thumbnail?: string
    }
  ): Promise<void> {
    try {
      await this.makeRequest(
        'PATCH',
        `${this.apiBaseUrl}/channels/${platformId}`,
        data,
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )
    } catch (error) {
      console.error('Error updating Restream livestream:', error)
      throw error
    }
  }

  /**
   * Start broadcasting on Restream
   */
  async startBroadcasting(platformId: string): Promise<void> {
    try {
      await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/channels/${platformId}/start`,
        {},
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )

      console.log(`Started broadcasting on Restream channel ${platformId}`)
    } catch (error) {
      console.error('Error starting Restream broadcast:', error)
      throw error
    }
  }

  /**
   * Stop broadcasting on Restream
   */
  async stopBroadcasting(platformId: string): Promise<void> {
    try {
      await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/channels/${platformId}/stop`,
        {},
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )

      console.log(`Stopped broadcasting on Restream channel ${platformId}`)
    } catch (error) {
      console.error('Error stopping Restream broadcast:', error)
      throw error
    }
  }

  /**
   * Delete livestream from Restream
   */
  async deleteLivestream(platformId: string): Promise<void> {
    try {
      await this.makeRequest(
        'DELETE',
        `${this.apiBaseUrl}/channels/${platformId}`,
        undefined,
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )

      console.log(`Deleted Restream channel ${platformId}`)
    } catch (error) {
      console.error('Error deleting Restream livestream:', error)
      throw error
    }
  }

  /**
   * Get Restream destinations (connected platforms)
   */
  async getDestinations(): Promise<
    Array<{
      id: string
      name: string
      platform: string
    }>
  > {
    try {
      const response = await this.makeRequest(
        'GET',
        `${this.apiBaseUrl}/destinations`,
        undefined,
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )

      return response.data || []
    } catch (error) {
      console.error('Error getting Restream destinations:', error)
      throw error
    }
  }

  /**
   * Get channel details
   */
  async getChannelDetails(platformId: string): Promise<any> {
    try {
      const response = await this.makeRequest(
        'GET',
        `${this.apiBaseUrl}/channels/${platformId}`,
        undefined,
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )

      return response
    } catch (error) {
      console.error('Error getting Restream channel details:', error)
      throw error
    }
  }
}
