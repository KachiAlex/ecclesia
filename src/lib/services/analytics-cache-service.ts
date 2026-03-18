/**
 * Analytics Cache Service
 * Stores and manages cached analytics computations for performance
 */

import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import { DataAggregationService, AnalyticsSnapshot } from './data-aggregation-service'
import { RecommendationService } from './recommendation-service'

export interface CachedAnalytics {
  churchId: string
  id: string
  snapshot: AnalyticsSnapshot
  recommendations: {
    attendance: unknown
    schedules: unknown
    engagement: unknown
    content: unknown
  }
  lastUpdated: Date
  nextRefresh: Date
  quality: {
    dataCompleteness: number
    eventsCount: number
    membersCount: number
  }
}

export class AnalyticsCacheService {
  private static readonly COLLECTION_NAME = 'analytics_cache'
  private static readonly CACHE_DURATION_MS = 1 * 60 * 60 * 1000 // 1 hour

  /**
   * Get or compute analytics cache
   */
  static async getCachedAnalytics(churchId: string): Promise<CachedAnalytics | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, churchId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return null
      }

      const data = docSnap.data() as any
      return {
        churchId: data.churchId,
        id: docSnap.id,
        snapshot: {
          ...data.snapshot,
          timestamp: data.snapshot.timestamp?.toDate?.() || new Date(data.snapshot.timestamp),
        },
        recommendations: data.recommendations || {},
        lastUpdated: data.lastUpdated?.toDate?.() || new Date(data.lastUpdated),
        nextRefresh: data.nextRefresh?.toDate?.() || new Date(data.nextRefresh),
        quality: data.quality || {},
      }
    } catch (error) {
      console.error('Error getting cached analytics:', error)
      return null
    }
  }

  /**
   * Check if cache is valid (not expired)
   */
  static async isCacheValid(churchId: string): Promise<boolean> {
    try {
      const cache = await this.getCachedAnalytics(churchId)
      if (!cache) return false

      const now = new Date()
      return cache.nextRefresh > now
    } catch (error) {
      console.error('Error checking cache validity:', error)
      return false
    }
  }

  /**
   * Refresh analytics cache by computing fresh data
   */
  static async refreshAnalyticsCache(churchId: string): Promise<CachedAnalytics> {
    try {
      // Collect fresh data
      const snapshot = await DataAggregationService.generateAnalyticsSnapshot(churchId)
      const quality = await DataAggregationService.assessDataQuality(churchId)
      
      // Generate recommendations from fresh data
      const members = await DataAggregationService.getMemberEngagementData(churchId)
      const events = await DataAggregationService.getHistoricalEvents(churchId, 90)

      const now = new Date()
      const nextRefresh = new Date(now.getTime() + this.CACHE_DURATION_MS)

      const cacheEntry: CachedAnalytics = {
        churchId,
        id: churchId,
        snapshot,
        recommendations: {
          attendance: snapshot, // Placeholder - would generate actual recommendations
          schedules: snapshot.optimalEventDays,
          engagement: {
            riskMembers: snapshot.riskMembers,
            leaders: snapshot.leadershipCandidates,
          },
          content: snapshot.topTopics,
        },
        lastUpdated: now,
        nextRefresh,
        quality: {
          dataCompleteness: quality.dataCompleteness,
          eventsCount: quality.eventsCount,
          membersCount: quality.membersCount,
        },
      }

      // Store in Firestore
      const docRef = doc(db, this.COLLECTION_NAME, churchId)
      await setDoc(docRef, {
        ...cacheEntry,
        lastUpdated: Timestamp.fromDate(now),
        nextRefresh: Timestamp.fromDate(nextRefresh),
        snapshot: {
          ...snapshot,
          timestamp: Timestamp.fromDate(snapshot.timestamp),
        },
      })

      return cacheEntry
    } catch (error) {
      console.error('Error refreshing analytics cache:', error)
      throw error
    }
  }

  /**
   * Get cached or fresh analytics
   * Returns cached if valid, otherwise computes fresh
   */
  static async getAnalytics(churchId: string, forceRefresh: boolean = false): Promise<CachedAnalytics> {
    try {
      // Check cache if not forcing refresh
      if (!forceRefresh) {
        const cached = await this.getCachedAnalytics(churchId)
        if (cached && (await this.isCacheValid(churchId))) {
          return cached
        }
      }

      // Refresh cache
      return await this.refreshAnalyticsCache(churchId)
    } catch (error) {
      console.error('Error getting analytics:', error)
      
      // Fallback to expired cache if refresh fails
      const cached = await this.getCachedAnalytics(churchId)
      if (cached) {
        return cached
      }

      throw error
    }
  }

  /**
   * Cache multiple churches' analytics in batch
   */
  static async refreshMultipleAnalytics(churchIds: string[]): Promise<Map<string, CachedAnalytics>> {
    const results = new Map<string, CachedAnalytics>()
    const errors = new Map<string, Error>()

    for (const churchId of churchIds) {
      try {
        const cache = await this.refreshAnalyticsCache(churchId)
        results.set(churchId, cache)
      } catch (error) {
        console.error(`Error refreshing analytics for church ${churchId}:`, error)
        errors.set(churchId, error instanceof Error ? error : new Error(String(error)))
      }
    }

    if (errors.size > 0) {
      console.warn(`${errors.size} churches failed to refresh analytics`)
    }

    return results
  }

  /**
   * Get cache statistics across all churches
   */
  static async getCacheStatistics(): Promise<{
    totalCached: number
    validCaches: number
    invalidCaches: number
    avgDataCompleteness: number
    totalMembers: number
    totalEvents: number
  }> {
    try {
      // Note: In production, you'd query the collection
      // For now return placeholder
      return {
        totalCached: 0,
        validCaches: 0,
        invalidCaches: 0,
        avgDataCompleteness: 0,
        totalMembers: 0,
        totalEvents: 0,
      }
    } catch (error) {
      console.error('Error getting cache statistics:', error)
      throw error
    }
  }

  /**
   * Clear specific cache or all caches
   */
  static async clearCache(churchId?: string): Promise<void> {
    try {
      if (churchId) {
        const docRef = doc(db, this.COLLECTION_NAME, churchId)
        await setDoc(docRef, { cleared: true, clearedAt: Timestamp.now() }, { merge: true })
      } else {
        // Note: In production, you'd batch delete all documents
        console.info('Batch clear cache not implemented')
      }
    } catch (error) {
      console.error('Error clearing cache:', error)
      throw error
    }
  }
}
