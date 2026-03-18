/**
 * Data Aggregation Service for PostgreSQL
 * Collects and aggregates real attendance, engagement, and member data using Prisma
 */

import { prisma } from '@/lib/prisma'
import { subDays, format, getDay, getHours, differenceInDays } from 'date-fns'

/**
 * Historical event data structure
 */
export interface HistoricalEvent {
  id: string
  date: Date
  dayOfWeek: string // "Monday", "Tuesday", etc.
  timeOfDay: 'morning' | 'afternoon' | 'evening'
  type: string
  expectedAttendees: number
  actualAttendees: number
  engagementScore: number // 0-100
}

/**
 * Member engagement data
 */
export interface MemberEngagementData {
  id: string
  firstName: string
  lastName: string
  email: string
  lastLogin: Date | null
  lastActivity: Date | null
  eventAttendance: number
  sermonsWatched: number
  volunteered: number
  gave: boolean
  engagementScore: number // 0-100
  daysInactive: number
  roles: string[]
}

/**
 * Content engagement data
 */
export interface ContentEngagementData {
  id: string
  title: string
  type: string
  topic: string
  publishedAt: Date | null
  viewCount: number
  completionRate: number // 0-1
  engagementScore: number // 0-100
}

/**
 * Analytics snapshot combining all data
 */
export interface AnalyticsSnapshot {
  churchId: string
  timestamp: Date
  totalMembers: number
  activeMembers: number // <30 days
  avgEngagement: number // 0-100
  topTopics: string[]
  riskMembers: Array<{
    id: string
    name: string
    reason: string
    engagementScore: number
  }>
  leadershipCandidates: Array<{
    id: string
    name: string
    readinessScore: number
    reasoning: string
  }>
  optimalEventDays: Array<{
    dayOfWeek: string
    timeOfDay: string
    avgAttendance: number
    confidence: 'low' | 'medium' | 'high'
  }>
}

/**
 * Data quality assessment
 */
export interface DataQuality {
  dataCompleteness: number // 0-100
  eventsCount: number
  membersCount: number
  avgEventAttendance: number
}

/**
 * DataAggregationService
 * Queries PostgreSQL via Prisma and aggregates for analytics
 */
export class DataAggregationService {
  /**
   * Get historical events for a church
   */
  static async getHistoricalEvents(
    churchId: string,
    daysBack: number = 90
  ): Promise<HistoricalEvent[]> {
    try {
      const startDate = subDays(new Date(), daysBack)

      const events = await prisma.event.findMany({
        where: {
          churchId: churchId,
          startDate: {
            gte: startDate,
          },
        },
        include: {
          attendances: true,
          registrations: true,
        },
        orderBy: {
          startDate: 'asc',
        },
      })

      return events.map((event) => {
        const expectedAttendees = event.maxAttendees || event.registrations.length || 0
        const actualAttendees = event.attendances.length
        const engagementScore =
          expectedAttendees > 0
            ? Math.min(100, (actualAttendees / expectedAttendees) * 100)
            : 0

        return {
          id: event.id,
          date: event.startDate,
          dayOfWeek: this.getDayOfWeek(event.startDate),
          timeOfDay: this.getTimeOfDay(event.startDate),
          type: event.type || 'SERVICE',
          expectedAttendees,
          actualAttendees,
          engagementScore,
        }
      })
    } catch (error) {
      console.error('Error getting historical events:', error)
      return []
    }
  }

  /**
   * Get member engagement data
   */
  static async getMemberEngagementData(churchId: string): Promise<MemberEngagementData[]> {
    try {
      const members = await prisma.user.findMany({
        where: {
          churchId: churchId,
          role: {
            in: ['MEMBER', 'VOLUNTEER', 'LEADER', 'PASTOR'],
          },
        },
        include: {
          eventsAttended: true,
          sermonsWatched: true,
          giving: true,
          volunteerShifts: true,
          departments: true,
        },
      })

      return members.map((member) => {
        const eventCount = member.eventsAttended.length
        const sermonCount = member.sermonsWatched.length
        const giverCount = member.giving.length > 0 ? 1 : 0
        const volunteerCount = member.volunteerShifts.length

        // Base engagement score: events (40%) + sermons (30%) + volunteer (20%) + giving (10%)
        const baseScore =
          (Math.min(eventCount, 10) / 10) * 40 +
          (Math.min(sermonCount, 10) / 10) * 30 +
          (Math.min(volunteerCount, 5) / 5) * 20 +
          giverCount * 10

        // Calculate inactivity (based on lastLoginAt)
        const lastActivity = member.lastLoginAt || member.createdAt
        const daysInactive = differenceInDays(new Date(), lastActivity)
        let decayMultiplier = 1

        if (daysInactive > 60) decayMultiplier = 0.5 // -50%
        else if (daysInactive > 30) decayMultiplier = 0.7 // -30%
        else if (daysInactive > 7) decayMultiplier = 0.9 // -10%

        const engagementScore = Math.max(0, baseScore * decayMultiplier)

        return {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          lastLogin: member.lastLoginAt,
          lastActivity,
          eventAttendance: eventCount,
          sermonsWatched: sermonCount,
          volunteered: volunteerCount,
          gave: giverCount > 0,
          engagementScore,
          daysInactive,
          roles: [member.role],
        }
      })
    } catch (error) {
      console.error('Error getting member engagement data:', error)
      return []
    }
  }

  /**
   * Get content engagement data
   */
  static async getContentEngagementData(
    churchId: string,
    limit: number = 50
  ): Promise<ContentEngagementData[]> {
    try {
      const sermons = await prisma.sermon.findMany({
        where: {
          churchId: churchId,
        },
        include: {
          views: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      })

      return sermons.map((sermon) => {
        const viewCount = sermon.views.length
        const completionRate =
          viewCount > 0
            ? sermon.views.filter((v) => v.completed).length / viewCount
            : 0

        const engagementScore = viewCount * 10 * completionRate * 10 // Adjust multiplier as needed
        const topicString = sermon.topics?.[0] || sermon.category || 'Uncategorized'

        return {
          id: sermon.id,
          title: sermon.title,
          type: 'sermon',
          topic: topicString,
          publishedAt: sermon.publishedAt,
          viewCount,
          completionRate,
          engagementScore: Math.min(100, engagementScore),
        }
      })
    } catch (error) {
      console.error('Error getting content engagement data:', error)
      return []
    }
  }

  /**
   * Generate comprehensive analytics snapshot
   */
  static async generateAnalyticsSnapshot(churchId: string): Promise<AnalyticsSnapshot> {
    try {
      const [events, members, content] = await Promise.all([
        this.getHistoricalEvents(churchId, 90),
        this.getMemberEngagementData(churchId),
        this.getContentEngagementData(churchId, 50),
      ])

      // Calculate overall metrics
      const totalMembers = members.length
      const activeMembers = members.filter((m) => m.daysInactive < 30).length
      const avgEngagement =
        members.length > 0
          ? members.reduce((sum, m) => sum + m.engagementScore, 0) / members.length
          : 0

      // Identify top topics
      const topicMap = new Map<string, number>()
      content.forEach((item) => {
        const current = topicMap.get(item.topic) || 0
        topicMap.set(item.topic, current + item.engagementScore)
      })
      const topTopics = Array.from(topicMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((entry) => entry[0])

      // Identify risk members (inactive 30+ days OR low engagement)
      const riskMembers = members
        .filter((m) => m.daysInactive >= 30 || m.engagementScore < 20)
        .map((m) => ({
          id: m.id,
          name: `${m.firstName} ${m.lastName}`,
          reason:
            m.daysInactive >= 30
              ? `Inactive for ${m.daysInactive} days`
              : 'Low engagement score',
          engagementScore: m.engagementScore,
        }))
        .slice(0, 20)

      // Identify leadership candidates
      const leadershipCandidates = members
        .filter((m) => m.engagementScore >= 70 && m.eventAttendance >= 8 && m.volunteered > 0)
        .map((m) => ({
          id: m.id,
          name: `${m.firstName} ${m.lastName}`,
          readinessScore: Math.min(100, m.engagementScore + m.volunteered * 5),
          reasoning: `High engagement, active volunteer, consistent attendance`,
        }))
        .slice(0, 10)

      // Analyze optimal event times
      const timeMap = new Map<string, number[]>()
      events.forEach((event) => {
        const key = `${event.dayOfWeek}_${event.timeOfDay}`
        if (!timeMap.has(key)) timeMap.set(key, [])
        timeMap.get(key)!.push(event.actualAttendees)
      })

      const optimalEventDays = Array.from(timeMap.entries())
        .map(([key, attendances]) => {
          const [dayOfWeek, timeOfDay] = key.split('_')
          const avgAttendance = attendances.reduce((a, b) => a + b, 0) / attendances.length
          const variance =
            attendances.reduce((sum, val) => sum + Math.pow(val - avgAttendance, 2), 0) /
            attendances.length
          const consistency = Math.max(
            0,
            100 - (Math.sqrt(variance) / avgAttendance) * 20
          )

          let confidence: 'low' | 'medium' | 'high' = 'low'
          if (attendances.length > 10) confidence = 'high'
          else if (attendances.length > 5) confidence = 'medium'

          return {
            dayOfWeek,
            timeOfDay: timeOfDay as 'morning' | 'afternoon' | 'evening',
            avgAttendance: Math.round(avgAttendance),
            confidence,
          }
        })
        .sort((a, b) => b.avgAttendance - a.avgAttendance)
        .slice(0, 7)

      return {
        churchId,
        timestamp: new Date(),
        totalMembers,
        activeMembers,
        avgEngagement: Math.round(avgEngagement),
        topTopics,
        riskMembers,
        leadershipCandidates,
        optimalEventDays,
      }
    } catch (error) {
      console.error('Error generating analytics snapshot:', error)
      return {
        churchId,
        timestamp: new Date(),
        totalMembers: 0,
        activeMembers: 0,
        avgEngagement: 0,
        topTopics: [],
        riskMembers: [],
        leadershipCandidates: [],
        optimalEventDays: [],
      }
    }
  }

  /**
   * Assess data quality
   */
  static async assessDataQuality(churchId: string): Promise<DataQuality> {
    try {
      // Get counts
      const [eventsResult, membersResult] = await Promise.all([
        prisma.event.count({
          where: { churchId },
        }),
        prisma.user.count({
          where: { churchId },
        }),
      ])

      // Calculate average attendance
      const events = await prisma.event.findMany({
        where: { churchId },
        include: {
          attendances: true,
        },
      })

      const totalAttendance = events.reduce((sum, e) => sum + e.attendances.length, 0)
      const avgEventAttendance = events.length > 0 ? totalAttendance / events.length : 0

      // Calculate completeness score
      let completeness = 0
      if (eventsResult >= 10) completeness += 25
      else if (eventsResult > 0) completeness += Math.round((eventsResult / 10) * 25)

      if (membersResult >= 50) completeness += 25
      else if (membersResult > 0) completeness += Math.round((membersResult / 50) * 25)

      if (avgEventAttendance > 0) completeness += 25
      if (events.some((e) => e.attendances.length > 0)) completeness += 25

      return {
        dataCompleteness: Math.min(100, completeness),
        eventsCount: eventsResult,
        membersCount: membersResult,
        avgEventAttendance: Math.round(avgEventAttendance * 10) / 10,
      }
    } catch (error) {
      console.error('Error assessing data quality:', error)
      return {
        dataCompleteness: 0,
        eventsCount: 0,
        membersCount: 0,
        avgEventAttendance: 0,
      }
    }
  }

  // Helper methods

  /**
   * Get day of week name
   */
  private static getDayOfWeek(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[getDay(date)]
  }

  /**
   * Get time of day period
   */
  private static getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' {
    const hour = getHours(date)
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    return 'evening'
  }
}
