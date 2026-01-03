import { BasePlatformClient } from './platform-client-base'
import { StreamingPlatform } from '@/lib/types/streaming'

/**
 * Microsoft Teams API Client
 * Handles meeting creation and management on Teams
 * Requirements: 2.1, 2.2, 6.3
 */
export class TeamsClient extends BasePlatformClient {
  platform = StreamingPlatform.TEAMS
  private apiBaseUrl = 'https://graph.microsoft.com/v1.0'

  /**
   * Authenticate with Microsoft Teams API
   */
  async authenticate(credentials: Record<string, any>): Promise<void> {
    try {
      if (!credentials.accessToken) {
        throw new Error('Teams access token is required')
      }

      this.credentials = credentials

      // Verify token by making a test request
      await this.makeRequest('GET', `${this.apiBaseUrl}/me`, undefined, {
        Authorization: `Bearer ${credentials.accessToken}`,
      })

      console.log('Teams authentication successful')
    } catch (error) {
      console.error('Teams authentication failed:', error)
      throw error
    }
  }

  /**
   * Create a meeting on Teams
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
      // Create an online meeting
      const response = await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/me/onlineMeetings`,
        {
          subject: data.title,
          startDateTime: new Date().toISOString(),
          endDateTime: new Date(Date.now() + 3600000).toISOString(),
          participants: {
            attendees: [],
          },
        },
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )

      return {
        platformId: response.id,
        url: response.joinWebUrl,
      }
    } catch (error) {
      console.error('Error creating Teams meeting:', error)
      throw error
    }
  }

  /**
   * Update meeting on Teams
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
        `${this.apiBaseUrl}/me/onlineMeetings/${platformId}`,
        {
          subject: data.title,
        },
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )
    } catch (error) {
      console.error('Error updating Teams meeting:', error)
      throw error
    }
  }

  /**
   * Start meeting on Teams
   */
  async startBroadcasting(platformId: string): Promise<void> {
    try {
      // Teams meetings start when the organizer joins
      console.log(`Teams meeting ${platformId} is ready to start`)
    } catch (error) {
      console.error('Error starting Teams meeting:', error)
      throw error
    }
  }

  /**
   * Stop meeting on Teams
   */
  async stopBroadcasting(platformId: string): Promise<void> {
    try {
      // End the meeting by updating its status
      await this.makeRequest(
        'POST',
        `${this.apiBaseUrl}/me/onlineMeetings/${platformId}/end`,
        {},
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )

      console.log(`Ended Teams meeting ${platformId}`)
    } catch (error) {
      console.error('Error stopping Teams meeting:', error)
      throw error
    }
  }

  /**
   * Delete meeting from Teams
   */
  async deleteLivestream(platformId: string): Promise<void> {
    try {
      await this.makeRequest(
        'DELETE',
        `${this.apiBaseUrl}/me/onlineMeetings/${platformId}`,
        undefined,
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )

      console.log(`Deleted Teams meeting ${platformId}`)
    } catch (error) {
      console.error('Error deleting Teams meeting:', error)
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
        `${this.apiBaseUrl}/me/onlineMeetings/${platformId}`,
        undefined,
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )

      return response
    } catch (error) {
      console.error('Error getting Teams meeting details:', error)
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
        `${this.apiBaseUrl}/me/onlineMeetings/${platformId}/participants`,
        undefined,
        {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        }
      )

      return response.value || []
    } catch (error) {
      console.error('Error getting Teams meeting participants:', error)
      throw error
    }
  }
}
