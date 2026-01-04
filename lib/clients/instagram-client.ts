import { BasePlatformClient } from './platform-client-base'
import { StreamingPlatform } from '@/lib/types/streaming'

interface InstagramLiveResponse {
  id: string
  stream_url?: string
  secure_stream_url?: string
  broadcast_url?: string
}

/**
 * Instagram Live API Client
 * Uses the Instagram Graph API (via connected Facebook page) to manage livestreams
 */
export class InstagramClient extends BasePlatformClient {
  platform = StreamingPlatform.INSTAGRAM
  private apiBaseUrl = 'https://graph.facebook.com/v19.0'

  /**
   * Authenticate with Instagram Graph API
   */
  async authenticate(credentials: Record<string, any>): Promise<void> {
    try {
      if (!credentials.accessToken) {
        throw new Error('Instagram access token is required')
      }
      if (!credentials.instagramUserId && !credentials.igUserId) {
        throw new Error('Instagram user ID is required')
      }

      this.credentials = credentials

      const instagramUserId = this.getInstagramUserId()

      await this.makeRequest(
        'GET',
        `${this.apiBaseUrl}/${instagramUserId}?fields=id,username`,
        undefined,
        this.authHeaders()
      )
    } catch (error) {
      console.error('Instagram authentication failed:', error)
      throw error
    }
  }

  /**
   * Create Instagram Live video (scheduled)
   */
  async createLivestream(data: {
    title: string
    description?: string
    thumbnail?: string
    startAt?: Date
    settings?: Record<string, any>
  }): Promise<{ platformId: string; url: string }> {
    try {
      const instagramUserId = this.getInstagramUserId()
      const scheduledStart = Math.floor((data.startAt?.getTime() ?? Date.now()) / 1000)

      const payload = {
        title: data.settings?.title || data.title,
        description: data.settings?.description || data.description || '',
        planned_start_time: scheduledStart,
      }

      const response = (await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/${instagramUserId}/live_videos`,
        payload,
        this.authHeaders()
      )) as InstagramLiveResponse

      return {
        platformId: response.id,
        url: response.broadcast_url || `https://instagram.com/${instagramUserId}`,
      }
    } catch (error) {
      console.error('Error creating Instagram livestream:', error)
      throw error
    }
  }

  async updateLivestream(
    platformId: string,
    data: {
      title?: string
      description?: string
      thumbnail?: string
      startAt?: Date
      settings?: Record<string, any>
    }
  ): Promise<void> {
    try {
      const payload: Record<string, any> = {}

      if (data.title) {
        payload.title = data.title
      }
      if (data.description) {
        payload.description = data.description
      }
      if (data.startAt) {
        payload.planned_start_time = Math.floor(data.startAt.getTime() / 1000)
      }

      if (Object.keys(payload).length === 0) {
        return
      }

      await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/${platformId}`,
        payload,
        this.authHeaders()
      )
    } catch (error) {
      console.error('Error updating Instagram livestream:', error)
      throw error
    }
  }

  async startBroadcasting(platformId: string): Promise<void> {
    try {
      await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/${platformId}/start`,
        {},
        this.authHeaders()
      )
    } catch (error) {
      console.error('Error starting Instagram broadcast:', error)
      throw error
    }
  }

  async stopBroadcasting(platformId: string): Promise<void> {
    try {
      await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/${platformId}/end_live_video`,
        {},
        this.authHeaders()
      )
    } catch (error) {
      console.error('Error stopping Instagram broadcast:', error)
      throw error
    }
  }

  async deleteLivestream(platformId: string): Promise<void> {
    try {
      await this.makeRequest(
        'DELETE',
        `${this.apiBaseUrl}/${platformId}`,
        undefined,
        this.authHeaders()
      )
    } catch (error) {
      console.error('Error deleting Instagram livestream:', error)
      throw error
    }
  }

  private getInstagramUserId(): string {
    return this.credentials.instagramUserId || this.credentials.igUserId
  }

  private authHeaders() {
    return {
      Authorization: `Bearer ${this.credentials.accessToken}`,
    }
  }
}
