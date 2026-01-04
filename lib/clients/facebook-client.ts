import { BasePlatformClient } from './platform-client-base'
import { StreamingPlatform } from '@/lib/types/streaming'

interface FacebookLiveVideo {
  id: string
  stream_url?: string
  secure_stream_url?: string
  permalink_url?: string
}

/**
 * Facebook Live API Client
 * Manages creation and lifecycle of Facebook Live videos
 */
export class FacebookClient extends BasePlatformClient {
  platform = StreamingPlatform.FACEBOOK
  private apiBaseUrl = 'https://graph.facebook.com/v19.0'

  /**
   * Authenticate with Facebook Graph API
   */
  async authenticate(credentials: Record<string, any>): Promise<void> {
    try {
      if (!credentials.accessToken) {
        throw new Error('Facebook access token is required')
      }
      if (!credentials.pageId) {
        throw new Error('Facebook pageId is required')
      }

      this.credentials = credentials

      // Verify access to the page
      await this.makeRequest(
        'GET',
        `${this.apiBaseUrl}/${this.credentials.pageId}?fields=id`,
        undefined,
        this.authHeaders()
      )
    } catch (error) {
      console.error('Facebook authentication failed:', error)
      throw error
    }
  }

  /**
   * Create a scheduled Facebook Live video
   */
  async createLivestream(data: {
    title: string
    description?: string
    thumbnail?: string
    startAt?: Date
    settings?: Record<string, any>
  }): Promise<{
    platformId: string
    url: string
  }> {
    try {
      const scheduledStart = (data.startAt ?? new Date()).toISOString()
      const payload = {
        title: data.settings?.title || data.title,
        description: data.settings?.description || data.description || '',
        status: 'SCHEDULED_UNPUBLISHED',
        planned_start_time: scheduledStart,
        published: data.settings?.published ?? true,
      }

      const response = (await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/${this.credentials.pageId}/live_videos`,
        payload,
        this.authHeaders()
      )) as FacebookLiveVideo

      return {
        platformId: response.id,
        url:
          response.permalink_url ||
          `https://www.facebook.com/${this.credentials.pageId}/videos/${response.id}`,
      }
    } catch (error) {
      console.error('Error creating Facebook livestream:', error)
      throw error
    }
  }

  /**
   * Update Facebook Live metadata
   */
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
        payload.planned_start_time = data.startAt.toISOString()
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
      console.error('Error updating Facebook livestream:', error)
      throw error
    }
  }

  /**
   * Start Facebook Live broadcast
   */
  async startBroadcasting(platformId: string): Promise<void> {
    try {
      await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/${platformId}`,
        { status: 'LIVE_NOW' },
        this.authHeaders()
      )
    } catch (error) {
      console.error('Error starting Facebook broadcast:', error)
      throw error
    }
  }

  /**
   * End Facebook Live broadcast
   */
  async stopBroadcasting(platformId: string): Promise<void> {
    try {
      await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/${platformId}`,
        { status: 'ENDED' },
        this.authHeaders()
      )
    } catch (error) {
      console.error('Error stopping Facebook broadcast:', error)
      throw error
    }
  }

  /**
   * Delete Facebook Live video
   */
  async deleteLivestream(platformId: string): Promise<void> {
    try {
      await this.makeRequest(
        'DELETE',
        `${this.apiBaseUrl}/${platformId}`,
        undefined,
        this.authHeaders()
      )
    } catch (error) {
      console.error('Error deleting Facebook livestream:', error)
      throw error
    }
  }

  private authHeaders() {
    return {
      Authorization: `Bearer ${this.credentials.accessToken}`,
    }
  }
}
