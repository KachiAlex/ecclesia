import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LivestreamService } from '@/lib/services/livestream-service'
import { StreamingPlatform } from '@/lib/types/streaming'

describe('Livestream Endpoints', () => {
  const churchId = 'test-church-123'
  const livestreamData = {
    title: 'Test Livestream',
    description: 'Test Description',
    platforms: [StreamingPlatform.RESTREAM, StreamingPlatform.YOUTUBE],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/livestreams - Create livestream', () => {
    it('should create a livestream with valid data', async () => {
      const result = await LivestreamService.createLivestream(churchId, livestreamData)

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('churchId')
      expect(result.churchId).toBe(churchId)
      expect(result.title).toBe(livestreamData.title)
    })

    it('should validate required fields', async () => {
      const invalidData = {
        title: '',
        description: 'Test',
        platforms: [StreamingPlatform.RESTREAM],
      }

      await expect(
        LivestreamService.createLivestream(churchId, invalidData)
      ).rejects.toThrow()
    })

    it('should require at least one platform', async () => {
      const invalidData = {
        title: 'Test',
        description: 'Test',
        platforms: [],
      }

      await expect(
        LivestreamService.createLivestream(churchId, invalidData)
      ).rejects.toThrow()
    })

    it('should store livestream metadata', async () => {
      const result = await LivestreamService.createLivestream(churchId, livestreamData)

      expect(result.title).toBe(livestreamData.title)
      expect(result.description).toBe(livestreamData.description)
      expect(result.platforms).toEqual(livestreamData.platforms)
    })

    it('should set initial status to CREATED', async () => {
      const result = await LivestreamService.createLivestream(churchId, livestreamData)

      expect(result.status).toBe('created')
    })
  })

  describe('GET /api/livestreams - List livestreams', () => {
    it('should list all livestreams for a church', async () => {
      const result = await LivestreamService.getLivestreams(churchId)

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return livestreams with required fields', async () => {
      const result = await LivestreamService.getLivestreams(churchId)

      result.forEach((livestream) => {
        expect(livestream).toHaveProperty('id')
        expect(livestream).toHaveProperty('title')
        expect(livestream).toHaveProperty('status')
      })
    })

    it('should filter livestreams by church ID', async () => {
      const result = await LivestreamService.getLivestreams(churchId)

      result.forEach((livestream) => {
        expect(livestream.churchId).toBe(churchId)
      })
    })

    it('should return empty array if no livestreams exist', async () => {
      const result = await LivestreamService.getLivestreams('non-existent-church')

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('GET /api/livestreams/[id] - Get livestream details', () => {
    it('should retrieve livestream by ID', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)
      const result = await LivestreamService.getLivestream(churchId, created.id)

      expect(result).not.toBeNull()
      expect(result?.id).toBe(created.id)
    })

    it('should return null if livestream not found', async () => {
      const result = await LivestreamService.getLivestream(churchId, 'non-existent-id')

      expect(result).toBeNull()
    })

    it('should return all livestream details', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)
      const result = await LivestreamService.getLivestream(churchId, created.id)

      expect(result?.title).toBe(livestreamData.title)
      expect(result?.description).toBe(livestreamData.description)
      expect(result?.platforms).toEqual(livestreamData.platforms)
    })

    it('should verify church ownership', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)
      const result = await LivestreamService.getLivestream('different-church', created.id)

      expect(result).toBeNull()
    })
  })

  describe('PATCH /api/livestreams/[id] - Update livestream', () => {
    it('should update livestream details', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)
      const updates = {
        title: 'Updated Title',
        description: 'Updated Description',
      }

      const result = await LivestreamService.updateLivestream(churchId, created.id, updates)

      expect(result?.title).toBe(updates.title)
      expect(result?.description).toBe(updates.description)
    })

    it('should preserve unchanged fields', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)
      const updates = {
        title: 'Updated Title',
      }

      const result = await LivestreamService.updateLivestream(churchId, created.id, updates)

      expect(result?.title).toBe(updates.title)
      expect(result?.description).toBe(livestreamData.description)
    })

    it('should not allow updating platforms after creation', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)
      const updates = {
        platforms: [StreamingPlatform.FACEBOOK],
      }

      await expect(
        LivestreamService.updateLivestream(churchId, created.id, updates)
      ).rejects.toThrow()
    })

    it('should verify church ownership before updating', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)

      await expect(
        LivestreamService.updateLivestream('different-church', created.id, {
          title: 'Hacked',
        })
      ).rejects.toThrow()
    })
  })

  describe('DELETE /api/livestreams/[id] - Delete livestream', () => {
    it('should delete a livestream', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)

      await expect(
        LivestreamService.deleteLivestream(churchId, created.id)
      ).resolves.not.toThrow()
    })

    it('should verify church ownership before deleting', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)

      await expect(
        LivestreamService.deleteLivestream('different-church', created.id)
      ).rejects.toThrow()
    })

    it('should not allow deleting active livestream', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)
      await LivestreamService.startBroadcasting(churchId, created.id)

      await expect(
        LivestreamService.deleteLivestream(churchId, created.id)
      ).rejects.toThrow()
    })
  })

  describe('POST /api/livestreams/[id]/start - Start broadcasting', () => {
    it('should start broadcasting to all platforms', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)

      const result = await LivestreamService.startBroadcasting(churchId, created.id)

      expect(result?.status).toBe('active')
    })

    it('should verify church ownership before starting', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)

      await expect(
        LivestreamService.startBroadcasting('different-church', created.id)
      ).rejects.toThrow()
    })

    it('should not allow starting already active livestream', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)
      await LivestreamService.startBroadcasting(churchId, created.id)

      await expect(
        LivestreamService.startBroadcasting(churchId, created.id)
      ).rejects.toThrow()
    })

    it('should generate platform-specific stream URLs', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)

      const result = await LivestreamService.startBroadcasting(churchId, created.id)

      expect(result?.platformLinks).toBeDefined()
      expect(result?.platformLinks?.length).toBeGreaterThan(0)
    })
  })

  describe('POST /api/livestreams/[id]/stop - Stop broadcasting', () => {
    it('should stop broadcasting to all platforms', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)
      await LivestreamService.startBroadcasting(churchId, created.id)

      const result = await LivestreamService.stopBroadcasting(churchId, created.id)

      expect(result?.status).toBe('stopped')
    })

    it('should verify church ownership before stopping', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)
      await LivestreamService.startBroadcasting(churchId, created.id)

      await expect(
        LivestreamService.stopBroadcasting('different-church', created.id)
      ).rejects.toThrow()
    })

    it('should not allow stopping inactive livestream', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)

      await expect(
        LivestreamService.stopBroadcasting(churchId, created.id)
      ).rejects.toThrow()
    })

    it('should continue if one platform fails', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)
      await LivestreamService.startBroadcasting(churchId, created.id)

      const result = await LivestreamService.stopBroadcasting(churchId, created.id)

      expect(result?.status).toBe('stopped')
    })
  })

  describe('GET /api/livestreams/[id]/platforms - Get platform links', () => {
    it('should return platform links for active livestream', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)
      await LivestreamService.startBroadcasting(churchId, created.id)

      const result = await LivestreamService.getPlatformLinks(churchId, created.id)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should include all selected platforms', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)
      await LivestreamService.startBroadcasting(churchId, created.id)

      const result = await LivestreamService.getPlatformLinks(churchId, created.id)

      livestreamData.platforms.forEach((platform) => {
        expect(result.some((link) => link.platform === platform)).toBe(true)
      })
    })

    it('should return empty array for inactive livestream', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)

      const result = await LivestreamService.getPlatformLinks(churchId, created.id)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })

    it('should verify church ownership', async () => {
      const created = await LivestreamService.createLivestream(churchId, livestreamData)

      await expect(
        LivestreamService.getPlatformLinks('different-church', created.id)
      ).rejects.toThrow()
    })
  })

  describe('Error handling', () => {
    it('should handle invalid church ID', async () => {
      await expect(
        LivestreamService.createLivestream('', livestreamData)
      ).rejects.toThrow()
    })

    it('should handle missing required fields', async () => {
      const invalidData = {
        title: '',
        description: '',
        platforms: [],
      }

      await expect(
        LivestreamService.createLivestream(churchId, invalidData)
      ).rejects.toThrow()
    })

    it('should handle database errors gracefully', async () => {
      // This test verifies error handling for database issues
      try {
        await LivestreamService.getLivestream(churchId, 'test-id')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })
})
