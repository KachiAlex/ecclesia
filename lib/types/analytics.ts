/**
 * Analytics Data Types for Church Performance Tracking
 */

export interface MeetingAnalytics {
  meetingId: string
  churchId: string
  title: string
  type: 'sermon' | 'event' | 'meeting' | 'training'
  scheduledDate: Date
  startedAt: Date
  endedAt?: Date
  totalAttendees: number
  peakAttendees: number
  averageSessionDuration: number // in minutes
  completionRate: number // percentage
  meetUrl?: string
  recordingUrl?: string
  engagementScore: number // 0-100
  metadata?: Record<string, any>
}

export interface LivestreamAnalytics {
  livestreamId: string
  churchId: string
  title: string
  startedAt: Date
  endedAt?: Date
  totalViewers: number
  peakViewers: number
  averageViewDuration: number // in minutes
  uniqueViewers: number
  completionRate: number
  engagementMetrics: {
    comments: number
    reactions: number
    shares: number
  }
  streamQuality: 'good' | 'fair' | 'poor'
  metadata?: Record<string, any>
}

export interface AttendanceAnalytics {
  attendanceId: string
  churchId: string
  date: Date
  eventType: 'service' | 'event' | 'meeting' | 'class'
  eventId: string
  totalExpected: number
  totalPresent: number
  totalAbsent: number
  attendanceRate: number // percentage
  onTimeCount: number
  lateCount: number
  departureTime?: Date
  engagementLevel: 'high' | 'medium' | 'low'
  metadata?: Record<string, any>
}

export interface EngagementAnalytics {
  engagementId: string
  churchId: string
  userId: string
  date: Date
  type: 'message' | 'comment' | 'reaction' | 'donation' | 'attendance' | 'volunteer'
  points: number
  metadata?: Record<string, any>
}

export interface DashboardMetrics {
  churchId: string
  period: 'week' | 'month' | 'year'
  startDate: Date
  endDate: Date
  
  // Meeting metrics
  totalMeetings: number
  avgMeetingAttendance: number
  avgMeetingEngagement: number
  
  // Livestream metrics
  totalLivestreams: number
  totalLivestreamViewers: number
  avgViewerRetention: number
  
  // Attendance metrics
  totalEvents: number
  avgAttendanceRate: number
  
  // Engagement metrics
  totalEngagementPoints: number
  activeMembers: number
  mostEngagedMembers: Array<{userId: string; points: number; name: string}>
  
  // Growth metrics
  memberGrowthRate: number
  engagementGrowthRate: number
}

export interface AnalyticsEvent {
  eventId: string
  churchId: string
  userId?: string
  timestamp: Date
  eventType: string
  action: string
  value?: number | string | boolean
  metadata?: Record<string, any>
}

export interface RealTimeAnalytics {
  churchId: string
  currentTime: Date
  activeMeetings: number
  activeViewers: number
  onlineMembersCount: number
  metrics: {
    messagesPerMinute: number
    engagementPerMinute: number
  }
}
