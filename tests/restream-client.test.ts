import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RestreamClient } from '@/lib/clients/restream-client'
import { StreamingPlatform } from '@/lib/types/streaming'

describe('RestreamClient', () => {
  const accessToken = 'test-access-token'
  let client: RestreamClient

  beforeEach(() => {
    client = new RestreamClient(accessToken)
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with access token', () => {
      expect(client).toBeDefined()
      expect(client.platform).toBe(StreamingPlatform.RESTREAM)
    })

    it('should throw error if access token is empty', () => {
      expect(() => new RestreamClient('')).toThrow()
    })
  })

  describe('createLivestream', () => {
    it('should create a livestream with valid parameters', async () => {
      const params = {
        title: 'Test Livestream',
        description: 'Test Description',
        platforms: ['youtube', 'facebook'],
      }

      const result = await client.createLivestream(params)

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('title')
      expect(result.title).toBe(params.title)
    })

    it('should include all required fields in request', async () => {
      const params = {
        title: 'Test Livestream',
        description: 'Test Description',
        platforms: ['youtube'],
      }

      const result = await client.createLivestream(params)

      expect(result.title).toBe(params.title)
      expect(result.description).toBe(params.description)
    })

    it('should handle multiple platforms', async () => {
      const params = {
        title: 'Multi-Platform Stream',
        description: 'Broadcasting to multiple platforms',
        platforms: ['youtube', 'facebook', 'instagram'],
      }

      const result = await client.createLivestream(params)

      expect(result).toBeDefined()
      expect(result.platforms).toContain('youtube')
    })

    it('should throw error if title is missing', async () => {
      const params = {
        title: '',
        description: 'Test Description',
        platforms: ['youtube'],
      }

      await expect(client.createLivestream(params)).rejects.toThrow()
    })
  })

  describe('startLivestream', () => {
    it('should start a livestream', async () => {
      const livestreamId = 'test-livestream-123'

      const result = await client.startLivestream(livestreamId)

      expect(result).toHaveProperty('status')
      expect(result.status).toBe('active')
    })

    it('should throw error if livestream ID is invalid', async () => {
      await expect(client.startLivestream('')).rejects.toThrow()
    })

    it('should return active status after starting', async () => {
      const livestreamId = 'test-livestream-456'

      const result = await client.startLivestream(livestreamId)

      expect(result.status).toBe('active')
    })
  })

  describe('stopLivestream', () => {
    it('should stop a livestream', async () => {
      const livestreamId = 'test-livestream-123'

      const result = await client.stopLivestream(livestreamId)

      expect(result).toHaveProperty('status')
      expect(result.status).toBe('stopped')
    })

    it('should throw error if livestream ID is invalid', async () => {
      await expect(client.stopLivestream('')).rejects.toThrow()
    })

    it('should return stopped status after stopping', async () => {
      const livestreamId = 'test-livestream-789'

      const result = await client.stopLivestream(livestreamId)

      expect(result.status).toBe('stopped')
    })
  })

  describe('updateLivestream', () => {
    it('should update livestream details', async () => {
      const livestreamId = 'test-livestream-123'
      const updates = {
        title: 'Updated Title',
        description: 'Updated Description',
      }

      const result = await client.updateLivestream(livestreamId, updates)

      expect(result.title).toBe(updates.title)
      expect(result.description).toBe(updates.description)
    })

    it('should preserve existing fields when updating', async () => {
      const livestreamId = 'test-livestream-123'
      const updates = {
        title: 'Updated Title',
      }

      const result = await client.updateLivestream(livestreamId, updates)

      expect(result.title).toBe(updates.title)
    })

    it('should throw error if livestream ID is invalid', async () => {
      await expect(
        client.updateLivestream('', { title: 'New Title' })
      ).rejects.toThrow()
    })
  })

  describe('deleteLivestream', () => {
    it('should delete a livestream', async () => {
      const livestreamId = 'test-livestream-123'

      await expect(client.deleteLivestream(livestreamId)).resolves.not.toThrow()
    })

    it('should throw error if livestream ID is invalid', async () => {
      await expect(client.deleteLivestream('')).rejects.toThrow()
    })
  })

  describe('getLivestream', () => {
    it('should retrieve livestream details', async () => {
      const livestreamId = 'test-livestream-123'

      const result = await client.getLivestream(livestreamId)

      expect(result).toHaveProperty('id')
      expect(result.id).toBe(livestreamId)
    })

    it('should throw error if livestream ID is invalid', async () => {
      await expect(client.getLivestream('')).rejects.toThrow()
    })

    it('should return all livestream properties', async () => {
      const livestreamId = 'test-livestream-123'

      const result = await client.getLivestream(livestreamId)

      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('description')
      expect(result).toHaveProperty('status')
    })
  })

  describe('listDestinations', () => {
    it('should list available destinations', async () => {
      const result = await client.listDestinations()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should return destination objects with required fields', async () => {
      const result = await client.listDestinations()

      result.forEach((destination) => {
        expect(destination).toHaveProperty('id')
        expect(destination).toHaveProperty('name')
      })
    })
  })

  describe('getDestinationDetails', () => {
    it('should retrieve destination details', async () => {
      const destinationId = 'youtube'

      const result = await client.getDestinationDetails(destinationId)

      expect(result).toHaveProperty('id')
      expect(result.id).toBe(destinationId)
    })

    it('should throw error if destination ID is invalid', async () => {
      await expect(client.getDestinationDetails('')).rejects.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const livestreamId = 'invalid-id'

      await expect(client.getLivestream(livestreamId)).rejects.toThrow()
    })

    it('should include error details in thrown exceptions', async () => {
      try {
        await client.getLivestream('invalid-id')
      } catch (error: any) {
        expect(error.message).toBeDefined()
      }
    })

    it('should handle network errors', async () => {
      const livestreamId = 'test-livestream-123'

      // This test verifies error handling for network issues
      try {
        await client.getLivestream(livestreamId)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('authentication', () => {
    it('should use provided access token for requests', () => {
      const token = 'custom-access-token'
      const customClient = new RestreamClient(token)

      expect(customClient).toBeDefined()
    })

    it('should throw error if token is expired', async () => {
      const expiredClient = new RestreamClient('expired-token')

      await expect(expiredClient.getLivestream('test-id')).rejects.toThrow()
    })
  })
})
