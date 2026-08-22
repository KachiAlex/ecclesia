import { StreamingPlatform } from '@/lib/types/streaming'

/**
 * Base Platform Client Interface
 * All platform clients should implement this interface
 */
export interface IPlatformClient {
  platform: StreamingPlatform
  authenticate(credentials: Record<string, any>): Promise<void>
  createLivestream(data: {
    title: string
    description?: string
    thumbnail?: string
    startAt?: Date
    settings?: Record<string, any>
  }): Promise<{
    platformId: string
    url: string
  }>
  updateLivestream(
    platformId: string,
    data: {
      title?: string
      description?: string
      thumbnail?: string
      startAt?: Date
      settings?: Record<string, any>
    }
  ): Promise<void>
  startBroadcasting(platformId: string): Promise<void>
  stopBroadcasting(platformId: string): Promise<void>
  deleteLivestream(platformId: string): Promise<void>
}

/**
 * Base Platform Client
 * Provides common functionality for all platform clients
 */
export abstract class BasePlatformClient implements IPlatformClient {
  abstract platform: StreamingPlatform
  protected credentials: Record<string, any> = {}

  async authenticate(credentials: Record<string, any>): Promise<void> {
    this.credentials = credentials
  }

  abstract createLivestream(data: {
    title: string
    description?: string
    thumbnail?: string
    startAt?: Date
    settings?: Record<string, any>
  }): Promise<{
    platformId: string
    url: string
  }>

  abstract updateLivestream(
    platformId: string,
    data: {
      title?: string
      description?: string
      thumbnail?: string
      startAt?: Date
      settings?: Record<string, any>
    }
  ): Promise<void>

  abstract startBroadcasting(platformId: string): Promise<void>

  abstract stopBroadcasting(platformId: string): Promise<void>

  abstract deleteLivestream(platformId: string): Promise<void>

  /**
   * Make HTTP request to platform API
   */
  protected async makeRequest(
    method: string,
    url: string,
    data?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<any> {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error making request to ${url}:`, error)
      throw error
    }
  }
}
