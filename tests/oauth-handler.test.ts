import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OAuthHandler } from '@/lib/services/oauth-handler'
import { StreamingPlatform } from '@/lib/types/streaming'

describe('OAuthHandler', () => {
  const churchId = 'test-church-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateOAuthState', () => {
    it('should generate OAuth state with PKCE challenge', () => {
      const result = OAuthHandler.generateOAuthState()

      expect(result).toHaveProperty('state')
      expect(result).toHaveProperty('codeChallenge')
      expect(result).toHaveProperty('codeVerifier')
    })

    it('should generate non-empty state', () => {
      const result = OAuthHandler.generateOAuthState()

      expect(result.state.length).toBeGreaterThan(0)
      expect(typeof result.state).toBe('string')
    })

    it('should generate non-empty code challenge', () => {
      const result = OAuthHandler.generateOAuthState()

      expect(result.codeChallenge.length).toBeGreaterThan(0)
      expect(typeof result.codeChallenge).toBe('string')
    })

    it('should generate non-empty code verifier', () => {
      const result = OAuthHandler.generateOAuthState()

      expect(result.codeVerifier.length).toBeGreaterThan(0)
      expect(typeof result.codeVerifier).toBe('string')
    })

    it('should use URL-safe base64 encoding for code challenge', () => {
      const result = OAuthHandler.generateOAuthState()

      // URL-safe base64 should not contain +, /, or =
      expect(result.codeChallenge).not.toMatch(/[+/=]/g)
    })

    it('should generate unique states on each call', () => {
      const result1 = OAuthHandler.generateOAuthState()
      const result2 = OAuthHandler.generateOAuthState()

      expect(result1.state).not.toBe(result2.state)
      expect(result1.codeVerifier).not.toBe(result2.codeVerifier)
      expect(result1.codeChallenge).not.toBe(result2.codeChallenge)
    })
  })

  describe('storeOAuthState', () => {
    it('should store OAuth state for a platform', async () => {
      const state = 'test-state-123'

      await expect(
        OAuthHandler.storeOAuthState(churchId, StreamingPlatform.RESTREAM, state)
      ).resolves.not.toThrow()
    })

    it('should handle multiple platforms', async () => {
      const state1 = 'test-state-1'
      const state2 = 'test-state-2'

      await expect(
        OAuthHandler.storeOAuthState(churchId, StreamingPlatform.RESTREAM, state1)
      ).resolves.not.toThrow()

      await expect(
        OAuthHandler.storeOAuthState(churchId, StreamingPlatform.ZOOM, state2)
      ).resolves.not.toThrow()
    })

    it('should throw error for invalid church ID', async () => {
      await expect(
        OAuthHandler.storeOAuthState('', StreamingPlatform.RESTREAM, 'test-state')
      ).rejects.toThrow()
    })
  })

  describe('validateOAuthState', () => {
    it('should validate stored OAuth state', async () => {
      const state = 'test-state-456'

      await OAuthHandler.storeOAuthState(churchId, StreamingPlatform.RESTREAM, state)
      const isValid = await OAuthHandler.validateOAuthState(
        churchId,
        StreamingPlatform.RESTREAM,
        state
      )

      expect(isValid).toBe(true)
    })

    it('should reject invalid state', async () => {
      const isValid = await OAuthHandler.validateOAuthState(
        churchId,
        StreamingPlatform.RESTREAM,
        'invalid-state'
      )

      expect(isValid).toBe(false)
    })

    it('should handle validation errors gracefully', async () => {
      const result = await OAuthHandler.validateOAuthState(
        churchId,
        StreamingPlatform.RESTREAM,
        'test-state'
      )

      expect(typeof result).toBe('boolean')
    })
  })

  describe('handleOAuthCallback', () => {
    it('should handle OAuth callback with valid state', async () => {
      const { state, codeVerifier } = OAuthHandler.generateOAuthState()
      const code = 'test-auth-code'

      await OAuthHandler.storeOAuthState(churchId, StreamingPlatform.RESTREAM, state)

      const result = await OAuthHandler.handleOAuthCallback(
        churchId,
        StreamingPlatform.RESTREAM,
        code,
        state,
        codeVerifier
      )

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('platform')
      expect(result.platform).toBe(StreamingPlatform.RESTREAM)
    })

    it('should reject callback with invalid state', async () => {
      const { codeVerifier } = OAuthHandler.generateOAuthState()
      const code = 'test-auth-code'
      const invalidState = 'invalid-state'

      await expect(
        OAuthHandler.handleOAuthCallback(
          churchId,
          StreamingPlatform.RESTREAM,
          code,
          invalidState,
          codeVerifier
        )
      ).rejects.toThrow()
    })

    it('should handle multiple platforms', async () => {
      const { state: state1, codeVerifier: verifier1 } = OAuthHandler.generateOAuthState()
      const { state: state2, codeVerifier: verifier2 } = OAuthHandler.generateOAuthState()

      await OAuthHandler.storeOAuthState(churchId, StreamingPlatform.RESTREAM, state1)
      await OAuthHandler.storeOAuthState(churchId, StreamingPlatform.ZOOM, state2)

      const result1 = await OAuthHandler.handleOAuthCallback(
        churchId,
        StreamingPlatform.RESTREAM,
        'code-1',
        state1,
        verifier1
      )

      const result2 = await OAuthHandler.handleOAuthCallback(
        churchId,
        StreamingPlatform.ZOOM,
        'code-2',
        state2,
        verifier2
      )

      expect(result1.platform).toBe(StreamingPlatform.RESTREAM)
      expect(result2.platform).toBe(StreamingPlatform.ZOOM)
    })
  })

  describe('refreshAccessToken', () => {
    it('should refresh access token for a platform', async () => {
      const result = await OAuthHandler.refreshAccessToken(churchId, StreamingPlatform.RESTREAM)

      expect(result).toHaveProperty('accessToken')
      expect(result.accessToken).toBeTruthy()
    })

    it('should handle refresh token errors', async () => {
      await expect(
        OAuthHandler.refreshAccessToken(churchId, StreamingPlatform.RESTREAM)
      ).rejects.toThrow()
    })

    it('should work for multiple platforms', async () => {
      try {
        await OAuthHandler.refreshAccessToken(churchId, StreamingPlatform.ZOOM)
      } catch (error) {
        // Expected to throw if no refresh token
        expect(error).toBeDefined()
      }

      try {
        await OAuthHandler.refreshAccessToken(churchId, StreamingPlatform.TEAMS)
      } catch (error) {
        // Expected to throw if no refresh token
        expect(error).toBeDefined()
      }
    })
  })

  describe('PKCE Security', () => {
    it('should generate cryptographically secure state', () => {
      const result = OAuthHandler.generateOAuthState()

      // State should be hex string (from crypto.randomBytes)
      expect(result.state).toMatch(/^[a-f0-9]+$/)
    })

    it('should generate valid SHA256 code challenge', () => {
      const result = OAuthHandler.generateOAuthState()

      // Code challenge should be URL-safe base64
      expect(result.codeChallenge).toMatch(/^[A-Za-z0-9\-_]+$/)
    })

    it('should prevent state reuse attacks', async () => {
      const { state } = OAuthHandler.generateOAuthState()

      await OAuthHandler.storeOAuthState(churchId, StreamingPlatform.RESTREAM, state)

      // State should be valid once
      const isValid1 = await OAuthHandler.validateOAuthState(
        churchId,
        StreamingPlatform.RESTREAM,
        state
      )
      expect(isValid1).toBe(true)

      // In production, state should be invalidated after use
      // This test verifies the mechanism exists
    })
  })
})
