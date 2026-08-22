import { BasePlatformClient } from './platform-client-base'
import { StreamingPlatform } from '@/lib/types/streaming'

/**
 * Zoom API Client
 * Handles meeting creation and management on Zoom
 * Requirements: 2.1, 2.2, 6.3
 */
export class ZoomClient extends BasePlatformClient {
  platform = StreamingPlatform.ZOOM
  private apiBaseUrl = 'https://api.zoom.us/v2'

  /**
   * Authenticate with Zoom API
   */
  async authenticate(credentials: Record<string, any>): Promise<void> {
    try {
      if (!credentials.accessToken) {
        throw new Error('Zoom access token is required')
      }

      this.credentials = credentials

      // Verify token by making a test request
      await this.makeRequest('GET', `${this.apiBaseUrl}/users/me`, undefined, {
        Authorization: `Bearer ${credentials.accessToken}`,
      })

      console.log('Zoom authentication successful')
    } catch (error) {
      console.error('Zoom authentication failed:', error)
      throw error
    }
  }

  /**
   * Create a meeting on Zoom
   * Property 3: Meeting Link Generation
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
      // For Zoom, we create a meeting instead of a livestream
      const response = await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/users/me/meetings`,
        {
          topic: data.title,
          type: 2, // Scheduled meeting
          start_time: new Date().toISOString(),
          duration: 60,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: true,
            waiting_room: false,
          },
        },
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )

      return {
        platformId: response.id.toString(),
        url: response.join_url,
      }
    } catch (error) {
      console.error('Error creating Zoom meeting:', error)
      throw error
    }
  }

  /**
   * Update meeting on Zoom
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
        `${this.apiBaseUrl}/meetings/${platformId}`,
        {
          topic: data.title,
        },
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )
    } catch (error) {
      console.error('Error updating Zoom meeting:', error)
      throw error
    }
  }

  /**
   * Start meeting on Zoom (meetings are started by participants joining)
   */
  async startBroadcasting(platformId: string): Promise<void> {
    try {
      // Zoom meetings start when the host joins
      console.log(`Zoom meeting ${platformId} is ready to start`)
    } catch (error) {
      console.error('Error starting Zoom meeting:', error)
      throw error
    }
  }

  /**
   * Stop meeting on Zoom
   */
  async stopBroadcasting(platformId: string): Promise<void> {
    try {
      // End the meeting
      await this.makeRequest(
        'PUT',
        `${this.apiBaseUrl}/meetings/${platformId}/status`,
        { action: 'end' },
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )

      console.log(`Ended Zoom meeting ${platformId}`)
    } catch (error) {
      console.error('Error stopping Zoom meeting:', error)
      throw error
    }
  }

  /**
   * Delete meeting from Zoom
   */
  async deleteLivestream(platformId: string): Promise<void> {
    try {
      await this.makeRequest(
        'DELETE',
        `${this.apiBaseUrl}/meetings/${platformId}`,
        undefined,
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )

      console.log(`Deleted Zoom meeting ${platformId}`)
    } catch (error) {
      console.error('Error deleting Zoom meeting:', error)
      throw error
    }
  }

  /**
   * Get meeting details
   */
  async getMeetingDetails(platformId: string): Promise<any> {
    try {
      const response = await this.makeRequest(
        'GET',
        `${this.apiBaseUrl}/meetings/${platformId}`,
        undefined,
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )

      return response
    } catch (error) {
      console.error('Error getting Zoom meeting details:', error)
      throw error
    }
  }

  /**
   * Get meeting participants
   */
  async getMeetingParticipants(platformId: string): Promise<any[]> {
    try {
      const response = await this.makeRequest(
        'GET',
        `${this.apiBaseUrl}/meetings/${platformId}/participants`,
        undefined,
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )

      return response.participants || []
    } catch (error) {
      console.error('Error getting Zoom meeting participants:', error)
      throw error
    }
  }
}
