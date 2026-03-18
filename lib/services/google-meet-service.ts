import { google } from 'googleapis'
import { PlatformConnectionService } from './platform-connection-service'
import { StreamingPlatform } from '@/lib/types/streaming'

export interface GoogleMeetCreateOptions {
  title: string
  description?: string
  startTime?: Date
  endTime?: Date
  attendees?: string[]
  conferenceDataVersion?: number
}

export interface GoogleMeetLink {
  meetUrl: string
  eventId: string
  calendarId: string
}

/**
 * Google Meet Service
 * Handles meeting creation and link generation via Google Calendar API
 */
export class GoogleMeetService {
  private static readonly SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ]

  /**
   * Create a Google Meet meeting
   */
  static async createMeeting(
    churchId: string,
    options: GoogleMeetCreateOptions
  ): Promise<GoogleMeetLink> {
    try {
      // Get credentials from platform connection service
      const credentials = await PlatformConnectionService.getDecryptedCredentials(
        churchId,
        StreamingPlatform.GOOGLE_MEET
      )

      if (!credentials) {
        throw new Error('Google Meet is not configured. Please connect Google Account in settings.')
      }

      // Create OAuth2 client
      const oauth2Client = this.createOAuth2Client(credentials)

      // Create calendar service
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

      // Create event with Google Meet conference
      const event = {
        summary: options.title,
        description: options.description || '',
        startTime: {
          dateTime: (options.startTime || new Date()).toISOString(),
          timeZone: 'UTC',
        },
        endTime: {
          dateTime: (options.endTime || new Date(Date.now() + 60 * 60 * 1000)).toISOString(),
          timeZone: 'UTC',
        },
        conferenceData: {
          createRequest: {
            requestId: `ecclesia-${Date.now()}`,
            conferenceSolutionKey: {
              key: 'hangoutsMeet',
            },
          },
        },
        attendees: (options.attendees || []).map(email => ({
          email,
        })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 },
          ],
        },
      }

      // Insert event into primary calendar
      const response = await calendar.events.insert({
        calendarId: credentials.calendarId || 'primary',
        requestBody: event as any,
        conferenceDataVersion: options.conferenceDataVersion || 1,
      })

      if (!response.data.conferenceData?.entryPoints?.length) {
        throw new Error('Failed to create Google Meet conference')
      }

      // Find the video entry point
      const meetEntry = response.data.conferenceData.entryPoints.find(
        ep => ep.entryPointType === 'video'
      )

      if (!meetEntry?.uri) {
        throw new Error('Failed to get Google Meet URL')
      }

      return {
        meetUrl: meetEntry.uri,
        eventId: response.data.id!,
        calendarId: credentials.calendarId || 'primary',
      }
    } catch (error: any) {
      console.error('Error creating Google Meet:', error)
      throw new Error(`Failed to create Google Meet: ${error.message}`)
    }
  }

  /**
   * Get meeting details
   */
  static async getMeetingDetails(
    churchId: string,
    eventId: string,
    calendarId: string = 'primary'
  ): Promise<any> {
    try {
      const credentials = await PlatformConnectionService.getDecryptedCredentials(
        churchId,
        StreamingPlatform.GOOGLE_MEET
      )

      if (!credentials) {
        throw new Error('Google Meet is not configured')
      }

      const oauth2Client = this.createOAuth2Client(credentials)
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

      const response = await calendar.events.get({
        calendarId: credentials.calendarId || calendarId,
        eventId,
      })

      return {
        title: response.data.summary,
        description: response.data.description,
        startTime: response.data.start?.dateTime,
        endTime: response.data.end?.dateTime,
        meetUrl: response.data.conferenceData?.entryPoints?.find(
          ep => ep.entryPointType === 'video'
        )?.uri,
        attendees: response.data.attendees?.map(a => a.email) || [],
      }
    } catch (error: any) {
      console.error('Error getting Google Meet details:', error)
      throw new Error(`Failed to get meeting details: ${error.message}`)
    }
  }

  /**
   * Update meeting details
   */
  static async updateMeeting(
    churchId: string,
    eventId: string,
    updates: Partial<GoogleMeetCreateOptions>,
    calendarId: string = 'primary'
  ): Promise<GoogleMeetLink> {
    try {
      const credentials = await PlatformConnectionService.getDecryptedCredentials(
        churchId,
        StreamingPlatform.GOOGLE_MEET
      )

      if (!credentials) {
        throw new Error('Google Meet is not configured')
      }

      const oauth2Client = this.createOAuth2Client(credentials)
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

      // Get current event
      const currentEvent = await calendar.events.get({
        calendarId: credentials.calendarId || calendarId,
        eventId,
      })

      // Update event fields
      const updatedEvent = {
        ...currentEvent.data,
        summary: updates.title || currentEvent.data.summary,
        description: updates.description || currentEvent.data.description,
        startTime: updates.startTime
          ? { dateTime: updates.startTime.toISOString(), timeZone: 'UTC' }
          : currentEvent.data.start,
        endTime: updates.endTime
          ? { dateTime: updates.endTime.toISOString(), timeZone: 'UTC' }
          : currentEvent.data.end,
      }

      if (updates.attendees) {
        updatedEvent.attendees = updates.attendees.map(email => ({
          email,
        }))
      }

      const response = await calendar.events.update({
        calendarId: credentials.calendarId || calendarId,
        eventId,
        requestBody: updatedEvent as any,
      })

      const meetEntry = response.data.conferenceData?.entryPoints?.find(
        ep => ep.entryPointType === 'video'
      )

      return {
        meetUrl: meetEntry?.uri || '',
        eventId: response.data.id!,
        calendarId: credentials.calendarId || calendarId,
      }
    } catch (error: any) {
      console.error('Error updating Google Meet:', error)
      throw new Error(`Failed to update meeting: ${error.message}`)
    }
  }

  /**
   * Delete meeting
   */
  static async deleteMeeting(
    churchId: string,
    eventId: string,
    calendarId: string = 'primary'
  ): Promise<void> {
    try {
      const credentials = await PlatformConnectionService.getDecryptedCredentials(
        churchId,
        StreamingPlatform.GOOGLE_MEET
      )

      if (!credentials) {
        throw new Error('Google Meet is not configured')
      }

      const oauth2Client = this.createOAuth2Client(credentials)
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

      await calendar.events.delete({
        calendarId: credentials.calendarId || calendarId,
        eventId,
      })
    } catch (error: any) {
      console.error('Error deleting Google Meet:', error)
      throw new Error(`Failed to delete meeting: ${error.message}`)
    }
  }

  /**
   * Generate Google Meet join URL
   */
  static generateMeetUrl(roomName: string): string {
    // Google Meet URLs follow pattern: https://meet.google.com/{roomName}
    return `https://meet.google.com/${encodeURIComponent(roomName)}`
  }

  /**
   * Create OAuth2 client from credentials
   */
  private static createOAuth2Client(credentials: any) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URL
    )

    oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
      expiry_date: credentials.expiryDate,
    })

    return oauth2Client
  }
}
