/**
 * Analytics Service - Track church performance metrics
 * Integrates with Firestore for storage and Socket.io for real-time updates
 */

import { db } from '@/lib/firebase'
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore'
import {
  MeetingAnalytics,
  LivestreamAnalytics,
  AttendanceAnalytics,
  DashboardMetrics,
  EngagementAnalytics,
  AnalyticsEvent,
  RealTimeAnalytics,
} from '@/lib/types/analytics'

const COLLECTIONS = {
  meetingAnalytics: 'meeting_analytics',
  livestreamAnalytics: 'livestream_analytics',
  attendanceAnalytics: 'attendance_analytics',
  engagementAnalytics: 'engagement_analytics',
  analyticsEvents: 'analytics_events',
}

export class AnalyticsService {
  /**
   * Record Meeting Analytics
   */
  static async recordMeeting(churchId: string, data: Omit<MeetingAnalytics, 'meetingId'>): Promise<string> {
    try {
      const ref = collection(db, COLLECTIONS.meetingAnalytics)
      const docRef = await addDoc(ref, {
        ...data,
        churchId,
        startedAt: Timestamp.fromDate(new Date(data.startedAt)),
        endedAt: data.endedAt ? Timestamp.fromDate(new Date(data.endedAt)) : null,
        scheduledDate: Timestamp.fromDate(new Date(data.scheduledDate)),
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error('Error recording meeting analytics:', error)
      throw error
    }
  }

  /**
   * Update Meeting Analytics
   */
  static async updateMeeting(churchId: string, meetingId: string, data: Partial<MeetingAnalytics>): Promise<void> {
    try {
      const ref = doc(db, COLLECTIONS.meetingAnalytics, meetingId)
      await updateDoc(ref, {
        ...data,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('Error updating meeting analytics:', error)
      throw error
    }
  }

  /**
   * Get Meeting Analytics
   */
  static async getMeetingAnalytics(churchId: string, meetingId: string): Promise<MeetingAnalytics | null> {
    try {
      const ref = doc(db, COLLECTIONS.meetingAnalytics, meetingId)
      const snap = await getDoc(ref)
      if (!snap.exists()) return null
      return snap.data() as MeetingAnalytics
    } catch (error) {
      console.error('Error getting meeting analytics:', error)
      throw error
    }
  }

  /**
   * Get Church Meeting Analytics (Period)
   */
  static async getChurchMeetingAnalytics(
    churchId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MeetingAnalytics[]> {
    try {
      const ref = collection(db, COLLECTIONS.meetingAnalytics)
      const q = query(
        ref,
        where('churchId', '==', churchId),
        where('startedAt', '>=', Timestamp.fromDate(startDate)),
        where('startedAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('startedAt', 'desc')
      )
      const snap = await getDocs(q)
      return snap.docs.map((doc) => doc.data() as MeetingAnalytics)
    } catch (error) {
      console.error('Error getting church meeting analytics:', error)
      throw error
    }
  }

  /**
   * Record Livestream Analytics
   */
  static async recordLivestream(
    churchId: string,
    data: Omit<LivestreamAnalytics, 'livestreamId'>
  ): Promise<string> {
    try {
      const ref = collection(db, COLLECTIONS.livestreamAnalytics)
      const docRef = await addDoc(ref, {
        ...data,
        churchId,
        startedAt: Timestamp.fromDate(new Date(data.startedAt)),
        endedAt: data.endedAt ? Timestamp.fromDate(new Date(data.endedAt)) : null,
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error('Error recording livestream analytics:', error)
      throw error
    }
  }

  /**
   * Update Livestream Analytics
   */
  static async updateLivestream(
    churchId: string,
    livestreamId: string,
    data: Partial<LivestreamAnalytics>
  ): Promise<void> {
    try {
      const ref = doc(db, COLLECTIONS.livestreamAnalytics, livestreamId)
      await updateDoc(ref, {
        ...data,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('Error updating livestream analytics:', error)
      throw error
    }
  }

  /**
   * Record Attendance Analytics
   */
  static async recordAttendance(
    churchId: string,
    data: Omit<AttendanceAnalytics, 'attendanceId'>
  ): Promise<string> {
    try {
      const ref = collection(db, COLLECTIONS.attendanceAnalytics)
      const docRef = await addDoc(ref, {
        ...data,
        churchId,
        date: Timestamp.fromDate(new Date(data.date)),
        departureTime: data.departureTime ? Timestamp.fromDate(new Date(data.departureTime)) : null,
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error('Error recording attendance analytics:', error)
      throw error
    }
  }

  /**
   * Get Attendance Analytics for Period
   */
  static async getAttendanceAnalytics(
    churchId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AttendanceAnalytics[]> {
    try {
      const ref = collection(db, COLLECTIONS.attendanceAnalytics)
      const q = query(
        ref,
        where('churchId', '==', churchId),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      )
      const snap = await getDocs(q)
      return snap.docs.map((doc) => doc.data() as AttendanceAnalytics)
    } catch (error) {
      console.error('Error getting attendance analytics:', error)
      throw error
    }
  }

  /**
   * Record Engagement Event
   */
  static async recordEngagementEvent(
    churchId: string,
    userId: string,
    type: string,
    points: number,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const ref = collection(db, COLLECTIONS.engagementAnalytics)
      const docRef = await addDoc(ref, {
        churchId,
        userId,
        type,
        points,
        metadata,
        date: Timestamp.now(),
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error('Error recording engagement event:', error)
      throw error
    }
  }

  /**
   * Get User Engagement Points (Period)
   */
  static async getUserEngagementPoints(
    churchId: string,
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      const ref = collection(db, COLLECTIONS.engagementAnalytics)
      const q = query(
        ref,
        where('churchId', '==', churchId),
        where('userId', '==', userId),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      )
      const snap = await getDocs(q)
      return snap.docs.reduce((total, doc) => total + (doc.data().points || 0), 0)
    } catch (error) {
      console.error('Error getting user engagement points:', error)
      throw error
    }
  }

  /**
   * Get Top Engaged Members
   */
  static async getTopEngagedMembers(
    churchId: string,
    startDate: Date,
    endDate: Date,
    limit_count: number = 10
  ): Promise<Array<{ userId: string; points: number }>> {
    try {
      const ref = collection(db, COLLECTIONS.engagementAnalytics)
      const q = query(
        ref,
        where('churchId', '==', churchId),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      )
      const snap = await getDocs(q)

      // Aggregate points by user
      const userPoints: Record<string, number> = {}
      snap.docs.forEach((doc) => {
        const data = doc.data()
        userPoints[data.userId] = (userPoints[data.userId] || 0) + (data.points || 0)
      })

      // Sort and return top N
      return Object.entries(userPoints)
        .map(([userId, points]) => ({ userId, points }))
        .sort((a, b) => b.points - a.points)
        .slice(0, limit_count)
    } catch (error) {
      console.error('Error getting top engaged members:', error)
      throw error
    }
  }

  /**
   * Calculate Dashboard Metrics
   */
  static async calculateDashboardMetrics(
    churchId: string,
    period: 'week' | 'month' | 'year'
  ): Promise<DashboardMetrics> {
    try {
      const endDate = new Date()
      const startDate = new Date()

      // Set date range based on period
      if (period === 'week') {
        startDate.setDate(endDate.getDate() - 7)
      } else if (period === 'month') {
        startDate.setMonth(endDate.getMonth() - 1)
      } else {
        startDate.setFullYear(endDate.getFullYear() - 1)
      }

      // Get all analytics for period
      const meetings = await this.getChurchMeetingAnalytics(churchId, startDate, endDate)
      const attendance = await this.getAttendanceAnalytics(churchId, startDate, endDate)
      const topMembers = await this.getTopEngagedMembers(churchId, startDate, endDate, 5)

      // Calculate metrics
      const totalEngagementPoints = topMembers.reduce((sum, member) => sum + member.points, 0)

      return {
        churchId,
        period,
        startDate,
        endDate,
        totalMeetings: meetings.length,
        avgMeetingAttendance:
          meetings.length > 0 ? meetings.reduce((sum, m) => sum + m.totalAttendees, 0) / meetings.length : 0,
        avgMeetingEngagement:
          meetings.length > 0 ? meetings.reduce((sum, m) => sum + m.engagementScore, 0) / meetings.length : 0,
        totalLivestreams: 0, // Would fetch from livestream collection
        totalLivestreamViewers: 0,
        avgViewerRetention: 0,
        totalEvents: attendance.length,
        avgAttendanceRate:
          attendance.length > 0
            ? attendance.reduce((sum, a) => sum + a.attendanceRate, 0) / attendance.length
            : 0,
        totalEngagementPoints,
        activeMembers: topMembers.length,
        mostEngagedMembers: topMembers.map((member) => ({
          userId: member.userId,
          points: member.points,
          name: '', // Would fetch from user profile
        })),
        memberGrowthRate: 0, // Would calculate from member collection
        engagementGrowthRate: 0, // Would compare current period to previous
      }
    } catch (error) {
      console.error('Error calculating dashboard metrics:', error)
      throw error
    }
  }

  /**
   * Get Church Livestream Analytics (Period)
   */
  static async getChurchLivestreamAnalytics(
    churchId: string,
    startDate: Date,
    endDate: Date
  ): Promise<LivestreamAnalytics[]> {
    try {
      const ref = collection(db, COLLECTIONS.livestreamAnalytics)
      const q = query(
        ref,
        where('churchId', '==', churchId),
        where('startedAt', '>=', Timestamp.fromDate(startDate)),
        where('startedAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('startedAt', 'desc')
      )
      const snap = await getDocs(q)
      return snap.docs.map((doc) => doc.data() as LivestreamAnalytics)
    } catch (error) {
      console.error('Error getting church livestream analytics:', error)
      throw error
    }
  }

  /**
   * Record Analytics Event (raw event logging)
   */
  static async recordAnalyticsEvent(
    churchId: string,
    eventType: string,
    action: string,
    userId?: string,
    value?: number | string | boolean,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const ref = collection(db, COLLECTIONS.analyticsEvents)
      const docRef = await addDoc(ref, {
        churchId,
        userId,
        eventType,
        action,
        value,
        metadata,
        timestamp: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error('Error recording analytics event:', error)
      throw error
    }
  }
}
