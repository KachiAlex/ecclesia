import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlatformConnectionService } from '@/lib/services/platform-connection-service'
import { StreamingPlatform, PlatformConnectionStatus } from '@/lib/types/streaming'
import { encryptCredentials, decryptCredentials } from '@/lib/utils/credential-encryption'
import { prisma } from '@/lib/prisma'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    platformConnection: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

describe('PlatformConnectionService', () => {
  const churchId = 'test-church-123'
  const testCredentials = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createConnection', () => {
    it('should create a new platform connection with encrypted credentials', async () => {
      const mockConnection = {
        id: 'conn-123',
        churchId,
        platform: StreamingPlatform.RESTREAM,
        status: PlatformConnectionStatus.CONNECTED,
        credentials: encryptCredentials(testCredentials),
        expiresAt: null,
        lastError: null,
        lastErrorAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.platformConnection.upsert).mockResolvedValue(mockConnection)

      const result = await PlatformConnectionService.createConnection(
        churchId,
        StreamingPlatform.RESTREAM,
        testCredentials
      )

      expect(result.churchId).toBe(churchId)
      expect(result.platform).toBe(StreamingPlatform.RESTREAM)
      expect(result.status).toBe(PlatformConnectionStatus.CONNECTED)
      expect(prisma.platformConnection.upsert).toHaveBeenCalled()
    })

    it('should reject invalid credentials', async () => {
      await expect(
        PlatformConnectionService.createConnection(churchId, StreamingPlatform.RESTREAM, {})
      ).rejects.toThrow('Invalid credentials')
    })

    it('should set expiration date if provided', async () => {
      const expiresAt = new Date(Date.now() + 3600000)
      const mockConnection = {
        id: 'conn-123',
        churchId,
        platform: StreamingPlatform.ZOOM,
        status: PlatformConnectionStatus.CONNECTED,
        credentials: encryptCredentials(testCredentials),
        expiresAt,
        lastError: null,
        lastErrorAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.platformConnection.upsert).mockResolvedValue(mockConnection)

      const result = await PlatformConnectionService.createConnection(
        churchId,
        StreamingPlatform.ZOOM,
        testCredentials,
        expiresAt
      )

      expect(result.expiresAt).toEqual(expiresAt)
    })
  })

  describe('getConnection', () => {
    it('should retrieve a platform connection', async () => {
      const mockConnection = {
        id: 'conn-123',
        churchId,
        platform: StreamingPlatform.RESTREAM,
        status: PlatformConnectionStatus.CONNECTED,
        credentials: encryptCredentials(testCredentials),
        expiresAt: null,
        lastError: null,
        lastErrorAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.platformConnection.findUnique).mockResolvedValue(mockConnection)

      const result = await PlatformConnectionService.getConnection(churchId, StreamingPlatform.RESTREAM)

      expect(result).not.toBeNull()
      expect(result?.platform).toBe(StreamingPlatform.RESTREAM)
    })

    it('should return null if connection does not exist', async () => {
      vi.mocked(prisma.platformConnection.findUnique).mockResolvedValue(null)

      const result = await PlatformConnectionService.getConnection(churchId, StreamingPlatform.RESTREAM)

      expect(result).toBeNull()
    })
  })

  describe('getConnections', () => {
    it('should retrieve all connections for a church', async () => {
      const mockConnections = [
        {
          id: 'conn-1',
          churchId,
          platform: StreamingPlatform.RESTREAM,
          status: PlatformConnectionStatus.CONNECTED,
          credentials: encryptCredentials(testCredentials),
          expiresAt: null,
          lastError: null,
          lastErrorAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'conn-2',
          churchId,
          platform: StreamingPlatform.ZOOM,
          status: PlatformConnectionStatus.CONNECTED,
          credentials: encryptCredentials(testCredentials),
          expiresAt: null,
          lastError: null,
          lastErrorAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.platformConnection.findMany).mockResolvedValue(mockConnections)

      const result = await PlatformConnectionService.getConnections(churchId)

      expect(result).toHaveLength(2)
      expect(result[0].platform).toBe(StreamingPlatform.RESTREAM)
      expect(result[1].platform).toBe(StreamingPlatform.ZOOM)
    })
  })

  describe('updateConnectionStatus', () => {
    it('should update connection status', async () => {
      const mockConnection = {
        id: 'conn-123',
        churchId,
        platform: StreamingPlatform.RESTREAM,
        status: PlatformConnectionStatus.EXPIRED,
        credentials: encryptCredentials(testCredentials),
        expiresAt: null,
        lastError: 'Token expired',
        lastErrorAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.platformConnection.update).mockResolvedValue(mockConnection)

      const result = await PlatformConnectionService.updateConnectionStatus(
        churchId,
        StreamingPlatform.RESTREAM,
        PlatformConnectionStatus.EXPIRED,
        'Token expired'
      )

      expect(result.status).toBe(PlatformConnectionStatus.EXPIRED)
      expect(result.lastError).toBe('Token expired')
    })
  })

  describe('disconnectPlatform', () => {
    it('should disconnect a platform', async () => {
      vi.mocked(prisma.platformConnection.delete).mockResolvedValue({})

      await expect(
        PlatformConnectionService.disconnectPlatform(churchId, StreamingPlatform.RESTREAM)
      ).resolves.not.toThrow()

      expect(prisma.platformConnection.delete).toHaveBeenCalled()
    })
  })

  describe('isConnectionExpired', () => {
    it('should return true if connection is expired', async () => {
      const pastDate = new Date(Date.now() - 3600000)
      const mockConnection = {
        id: 'conn-123',
        churchId,
        platform: StreamingPlatform.RESTREAM,
        status: PlatformConnectionStatus.CONNECTED,
        credentials: encryptCredentials(testCredentials),
        expiresAt: pastDate,
        lastError: null,
        lastErrorAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.platformConnection.findUnique).mockResolvedValue(mockConnection)

      const result = await PlatformConnectionService.isConnectionExpired(churchId, StreamingPlatform.RESTREAM)

      expect(result).toBe(true)
    })

    it('should return false if connection is not expired', async () => {
      const futureDate = new Date(Date.now() + 3600000)
      const mockConnection = {
        id: 'conn-123',
        churchId,
        platform: StreamingPlatform.RESTREAM,
        status: PlatformConnectionStatus.CONNECTED,
        credentials: encryptCredentials(testCredentials),
        expiresAt: futureDate,
        lastError: null,
        lastErrorAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.platformConnection.findUnique).mockResolvedValue(mockConnection)

      const result = await PlatformConnectionService.isConnectionExpired(churchId, StreamingPlatform.RESTREAM)

      expect(result).toBe(false)
    })
  })
})
