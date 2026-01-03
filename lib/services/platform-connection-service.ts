import { prisma } from '@/lib/firestore'
import { StreamingPlatform, PlatformConnectionStatus, PlatformCredentials, PlatformConnectionData } from '@/lib/types/streaming'
import { encryptCredentials, decryptCredentials, validateCredentials } from '@/lib/utils/credential-encryption'

/**
 * Platform Connection Service
 * Manages OAuth and API key authentication for streaming platforms
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export class PlatformConnectionService {
  /**
   * Create or update a platform connection
   * Property 1: Platform Connection Consistency - if status is "connected", credentials must be valid
   */
  static async createConnection(
    churchId: string,
    platform: StreamingPlatform,
    credentials: PlatformCredentials,
    expiresAt?: Date
  ): Promise<PlatformConnectionData> {
    try {
      // Validate credentials
      if (!validateCredentials(credentials)) {
        throw new Error('Invalid credentials: at least one credential field is required')
      }

      // Encrypt credentials before storing
      const encryptedCredentials = encryptCredentials(credentials)

      const connection = await prisma.platformConnection.upsert({
        where: {
          churchId_platform: {
            churchId,
            platform,
          },
        },
        update: {
          credentials: encryptedCredentials,
          status: PlatformConnectionStatus.CONNECTED,
          expiresAt,
          lastError: null,
          lastErrorAt: null,
          updatedAt: new Date(),
        },
        create: {
          churchId,
          platform,
          credentials: encryptedCredentials,
          status: PlatformConnectionStatus.CONNECTED,
          expiresAt,
        },
      })

      return this.formatConnection(connection)
    } catch (error) {
      console.error(`Error creating connection for ${platform}:`, error)
      throw error
    }
  }

  /**
   * Get a platform connection
   */
  static async getConnection(churchId: string, platform: StreamingPlatform): Promise<PlatformConnectionData | null> {
    try {
      const connection = await prisma.platformConnection.findUnique({
        where: {
          churchId_platform: {
            churchId,
            platform,
          },
        },
      })

      if (!connection) {
        return null
      }

      return this.formatConnection(connection)
    } catch (error) {
      console.error(`Error getting connection for ${platform}:`, error)
      throw error
    }
  }

  /**
   * Get all connections for a church
   */
  static async getConnections(churchId: string): Promise<PlatformConnectionData[]> {
    try {
      const connections = await prisma.platformConnection.findMany({
        where: { churchId },
      })

      return connections.map((conn) => this.formatConnection(conn))
    } catch (error) {
      console.error('Error getting connections:', error)
      throw error
    }
  }

  /**
   * Update connection status
   * Property 6: Connection Status Accuracy - displayed status must reflect current connection state
   */
  static async updateConnectionStatus(
    churchId: string,
    platform: StreamingPlatform,
    status: PlatformConnectionStatus,
    error?: string
  ): Promise<PlatformConnectionData> {
    try {
      const connection = await prisma.platformConnection.update({
        where: {
          churchId_platform: {
            churchId,
            platform,
          },
        },
        data: {
          status,
          lastError: error || null,
          lastErrorAt: error ? new Date() : null,
          updatedAt: new Date(),
        },
      })

      return this.formatConnection(connection)
    } catch (error) {
      console.error(`Error updating connection status for ${platform}:`, error)
      throw error
    }
  }

  /**
   * Disconnect a platform
   */
  static async disconnectPlatform(churchId: string, platform: StreamingPlatform): Promise<void> {
    try {
      await prisma.platformConnection.delete({
        where: {
          churchId_platform: {
            churchId,
            platform,
          },
        },
      })
    } catch (error) {
      console.error(`Error disconnecting ${platform}:`, error)
      throw error
    }
  }

  /**
   * Get decrypted credentials for API calls
   * Property 7: Credential Encryption - decrypted only when needed for API calls
   */
  static async getDecryptedCredentials(churchId: string, platform: StreamingPlatform): Promise<PlatformCredentials> {
    try {
      const connection = await this.getConnection(churchId, platform)

      if (!connection) {
        throw new Error(`No connection found for ${platform}`)
      }

      if (connection.status !== PlatformConnectionStatus.CONNECTED) {
        throw new Error(`Connection is not active: ${connection.status}`)
      }

      // Decrypt credentials from the encrypted string stored in DB
      const encrypted = (await prisma.platformConnection.findUnique({
        where: {
          churchId_platform: {
            churchId,
            platform,
          },
        },
        select: { credentials: true },
      })) as any

      if (!encrypted) {
        throw new Error('Connection not found')
      }

      return decryptCredentials(encrypted.credentials)
    } catch (error) {
      console.error(`Error getting decrypted credentials for ${platform}:`, error)
      throw error
    }
  }

  /**
   * Check if connection is expired and needs refresh
   */
  static async isConnectionExpired(churchId: string, platform: StreamingPlatform): Promise<boolean> {
    try {
      const connection = await this.getConnection(churchId, platform)

      if (!connection || !connection.expiresAt) {
        return false
      }

      return new Date() > connection.expiresAt
    } catch (error) {
      console.error(`Error checking expiration for ${platform}:`, error)
      return true
    }
  }

  /**
   * Format connection for API response (without exposing encrypted credentials)
   */
  private static formatConnection(connection: any): PlatformConnectionData {
    return {
      id: connection.id,
      churchId: connection.churchId,
      platform: connection.platform,
      status: connection.status,
      credentials: {}, // Don't expose encrypted credentials in response
      expiresAt: connection.expiresAt,
      lastError: connection.lastError,
      lastErrorAt: connection.lastErrorAt,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    }
  }
}
