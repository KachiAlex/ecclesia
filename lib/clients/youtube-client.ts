import { BasePlatformClient } from './platform-client-base'
import { StreamingPlatform } from '@/lib/types/streaming'

interface YouTubeCreateResponse {
  id: string
  snippet?: {
    liveBroadcastContent?: string
  }
}

interface YouTubeStreamResponse {
  id: string
  cdn?: {
    ingestionInfo?: {
      streamName?: string
      ingestionAddress?: string
    }
  }
}

/**
 * YouTube Live Streaming API Client
 * Handles broadcast provisioning and lifecycle management
 * Requirements: 1.1, 1.2, 6.1
 */
export class YouTubeClient extends BasePlatformClient {
  platform = StreamingPlatform.YOUTUBE
  private apiBaseUrl = 'https://www.googleapis.com/youtube/v3'

  /**
   * Authenticate with YouTube API
   */
  async authenticate(credentials: Record<string, any>): Promise<void> {
    try {
      if (!credentials.accessToken) {
        throw new Error('YouTube OAuth access token is required')
      }

      this.credentials = credentials

      // Verify token by fetching channel details
      await this.makeRequest(
        'GET',
        `${this.apiBaseUrl}/channels?part=id&mine=true`,
        undefined,
        this.authHeaders()
      )
    } catch (error) {
      console.error('YouTube authentication failed:', error)
      throw error
    }
  }

  /**
   * Create a YouTube livestream (broadcast + stream + binding)
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

      const broadcastPayload = {
        snippet: {
          title: data.settings?.title || data.title,
          description: data.settings?.description || data.description || '',
          scheduledStartTime: scheduledStart,
        },
        status: {
          privacyStatus: data.settings?.privacyStatus || 'public',
        },
        contentDetails: {
          enableAutoStart: true,
          enableAutoStop: true,
        },
      }

      const broadcast = (await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/liveBroadcasts?part=snippet,contentDetails,status`,
        broadcastPayload,
        this.authHeaders()
      )) as YouTubeCreateResponse

      const streamPayload = {
        snippet: {
          title: `${broadcastPayload.snippet.title} Stream`,
          description: broadcastPayload.snippet.description,
        },
        cdn: {
          frameRate: 'variable',
          ingestionType: 'rtmp',
          resolution: data.settings?.resolution || 'variable',
        },
      }

      const stream = (await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/liveStreams?part=snippet,cdn,contentDetails`,
        streamPayload,
        this.authHeaders()
      )) as YouTubeStreamResponse

      // Bind broadcast to stream so it can go live
      await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/liveBroadcasts/bind?id=${broadcast.id}&part=id&streamId=${stream.id}`,
        {},
        this.authHeaders()
      )

      return {
        platformId: broadcast.id,
        url: `https://www.youtube.com/watch?v=${broadcast.id}`,
      }
    } catch (error) {
      console.error('Error creating YouTube livestream:', error)
      throw error
    }
  }

  /**
   * Update YouTube broadcast metadata
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
      const payload: Record<string, any> = {
        id: platformId,
        snippet: {},
      }

      if (data.title) {
        payload.snippet.title = data.title
      }
      if (data.description) {
        payload.snippet.description = data.description
      }
      if (data.startAt) {
        payload.snippet.scheduledStartTime = data.startAt.toISOString()
      }

      await this.makeRequest(
        'PUT',
        `${this.apiBaseUrl}/liveBroadcasts?part=snippet`,
        payload,
        this.authHeaders()
      )
    } catch (error) {
      console.error('Error updating YouTube livestream:', error)
      throw error
    }
  }

  /**
   * Transition broadcast to LIVE
   */
  async startBroadcasting(platformId: string): Promise<void> {
    try {
      await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/liveBroadcasts/transition?broadcastStatus=live&id=${platformId}&part=status`,
        {},
        this.authHeaders()
      )
    } catch (error) {
      console.error('Error starting YouTube broadcast:', error)
      throw error
    }
  }

  /**
   * Transition broadcast to COMPLETE
   */
  async stopBroadcasting(platformId: string): Promise<void> {
    try {
      await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/liveBroadcasts/transition?broadcastStatus=complete&id=${platformId}&part=status`,
        {},
        this.authHeaders()
      )
    } catch (error) {
      console.error('Error stopping YouTube broadcast:', error)
      throw error
    }
  }

  /**
   * Delete broadcast
   */
  async deleteLivestream(platformId: string): Promise<void> {
    try {
      await this.makeRequest(
        'DELETE',
        `${this.apiBaseUrl}/liveBroadcasts?id=${platformId}`,
        undefined,
        this.authHeaders()
      )
    } catch (error) {
      console.error('Error deleting YouTube broadcast:', error)
      throw error
    }
  }

  private authHeaders() {
    return {
      Authorization: `Bearer ${this.credentials.accessToken}`,
    }
  }
}
