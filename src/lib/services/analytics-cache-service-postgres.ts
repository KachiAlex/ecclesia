/**
 * Analytics Cache Service for PostgreSQL
 * Caches computed analytics to avoid expensive recomputation
 * Uses PostgreSQL (via Prisma) as the persistence layer
 */

import { prisma } from '@/lib/prisma'
import { DataAggregationService, AnalyticsSnapshot, DataQuality } from './data-aggregation-service-postgres'

/**
 * Cached analytics structure
 */
export interface CachedAnalytics {
  churchId: string
  id: string // Same as churchId
  snapshot: AnalyticsSnapshot
  recommendations: {
    attendance: Array<{ topic: string; reason: string; priority: number }>
    schedules: Array<{ dayOfWeek: string; time: string; expected: number }>
    engagement: Array<{ memberId: string; action: string }>
    content: Array<{ topic: string; viewsExpected: number }>
  }
  lastUpdated: Date
  nextRefresh: Date
  quality: DataQuality
}

/**
 * AnalyticsCacheService
 * Manages caching of computed analytics with PostgreSQL persistence (via Prisma)
 */
export class AnalyticsCacheService {
  private static CACHE_DURATION_MS = 60 * 60 * 1000 // 1 hour

  /**
   * Get cached analytics from PostgreSQL
   */
  static async getCachedAnalytics(churchId: string): Promise<CachedAnalytics | null> {
    try {
      const cached = await prisma.analyticsCache.findUnique({
        where: { churchId },
      })

      if (!cached) return null

      return {
        churchId,
        id: churchId,
        snapshot: cached.snapshotData as AnalyticsSnapshot,
        recommendations: cached.recommendationsData as CachedAnalytics['recommendations'],
        lastUpdated: cached.lastUpdated,
        nextRefresh: cached.nextRefresh,
        quality: cached.qualityData as DataQuality,
      }
    } catch (error) {
      console.error('Error getting cached analytics:', error)
      return null
    }
  }

  /**
   * Check if cache is still valid (TTL)
   */
  static isCacheValid(nextRefresh: Date): boolean {
    return new Date() < nextRefresh
  }

  /**
   * Refresh analytics cache
   */
  static async refreshAnalyticsCache(churchId: string): Promise<CachedAnalytics> {
    try {
      // Get fresh data from aggregation service
      const [snapshot, quality] = await Promise.all([
        DataAggregationService.generateAnalyticsSnapshot(churchId),
        DataAggregationService.assessDataQuality(churchId),
      ])

      // Generate recommendations
      const recommendations = {
        attendance: [
          {
            topic: snapshot.topTopics[0] || 'General',
            reason: 'High engagement on this topic',
            priority: 9,
          },
        ],
        schedules: snapshot.optimalEventDays.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          time: day.timeOfDay,
          expected: day.avgAttendance,
        })),
        engagement: snapshot.riskMembers.map((member) => ({
          memberId: member.id,
          action: `Follow up with ${member.name}`,
        })),
        content: snapshot.topTopics.map((topic) => ({
          topic,
          viewsExpected: 150,
        })),
      }

      const now = new Date()
      const nextRefresh = new Date(now.getTime() + this.CACHE_DURATION_MS)

      // Upsert cache in PostgreSQL
      const cached = await prisma.analyticsCache.upsert({
        where: { churchId },
        create: {
          churchId,
          snapshotData: snapshot,
          recommendationsData: recommendations,
          lastUpdated: now,
          nextRefresh,
          qualityData: quality,
        },
        update: {
          snapshotData: snapshot,
          recommendationsData: recommendations,
          lastUpdated: now,
          nextRefresh,
          qualityData: quality,
          updatedAt: new Date(),
        },
      })

      return {
        churchId,
        id: churchId,
        snapshot,
        recommendations,
        lastUpdated: cached.lastUpdated,
        nextRefresh: cached.nextRefresh,
        quality,
      }
    } catch (error) {
      console.error('Error refreshing analytics cache:', error)
      throw error
    }
  }

  /**
   * Smart getter - returns cached if valid, else refreshes
   */
  static async getAnalytics(
    churchId: string,
    forceRefresh: boolean = false
  ): Promise<CachedAnalytics> {
    try {
      if (!forceRefresh) {
        const cached = await this.getCachedAnalytics(churchId)
        if (cached && this.isCacheValid(cached.nextRefresh)) {
          return cached
        }
      }

      // Cache miss or expired - refresh
      return await this.refreshAnalyticsCache(churchId)
    } catch (error) {
      console.error('Error getting analytics:', error)

      // Fallback to expired cache if refresh fails
      const cached = await this.getCachedAnalytics(churchId)
      if (cached) {
        return cached
      }

      // Fallback to default if no cache
      return {
        churchId,
        id: churchId,
        snapshot: {
          churchId,
          timestamp: new Date(),
          totalMembers: 0,
          activeMembers: 0,
          avgEngagement: 0,
          topTopics: [],
          riskMembers: [],
          leadershipCandidates: [],
          optimalEventDays: [],
        },
        recommendations: {
          attendance: [],
          schedules: [],
          engagement: [],
          content: [],
        },
        lastUpdated: new Date(),
        nextRefresh: new Date(),
        quality: {
          dataCompleteness: 0,
          eventsCount: 0,
          membersCount: 0,
          avgEventAttendance: 0,
        },
      }
    }
  }

  /**
   * Refresh analytics for multiple churches
   */
  static async refreshMultipleAnalytics(
    churchIds: string[]
  ): Promise<Map<string, CachedAnalytics>> {
    const results = new Map<string, CachedAnalytics>()
    const errors = new Map<string, Error>()

    for (const churchId of churchIds) {
      try {
        const analytics = await this.refreshAnalyticsCache(churchId)
        results.set(churchId, analytics)
      } catch (error) {
        errors.set(churchId, error as Error)
        console.error(`Error refreshing analytics for ${churchId}:`, error)
      }
    }

    return results
  }

  /**
   * Get cache statistics
   */
  static async getCacheStatistics(): Promise<{
    cachedChurches: number
    totalRefreshes: number
    avgCacheAge: number
  }> {
    try {
      const count = await prisma.analyticsCache.count()
      
      return {
        cachedChurches: count,
        totalRefreshes: 0, // Would need to track this separately if needed
        avgCacheAge: 0,
      }
    } catch (error) {
      console.error('Error getting cache statistics:', error)
      return {
        cachedChurches: 0,
        totalRefreshes: 0,
        avgCacheAge: 0,
      }
    }
  }

  /**
   * Clear cache for a church
   */
  static async clearCache(churchId: string): Promise<void> {
    try {
      await prisma.analyticsCache.delete({
        where: { churchId },
      })
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }
}
