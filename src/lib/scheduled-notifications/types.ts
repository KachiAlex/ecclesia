/**
 * Types for Scheduled Notifications & Email Digests
 * Defines interfaces for scheduling recommendations and sending them via email
 */

export type ScheduleFrequency = 'once' | 'daily' | 'weekly' | 'monthly'
export type DigestFormat = 'compact' | 'detailed' | 'summary'
export type NotificationStatus = 'active' | 'paused' | 'completed' | 'failed'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface ScheduleTime {
  hour: number // 0-23
  minute: number // 0-59
  timezone?: string // e.g., 'America/New_York'
}

export interface WeeklyScheduleConfig {
  days: DayOfWeek[]
  time: ScheduleTime
}

export interface MonthlyScheduleConfig {
  dayOfMonth: number // 1-28 (accounts for all months)
  time: ScheduleTime
}

export interface ScheduleConfig {
  frequency: ScheduleFrequency
  time?: ScheduleTime // For 'once' and 'daily'
  weeklyConfig?: WeeklyScheduleConfig // For 'weekly'
  monthlyConfig?: MonthlyScheduleConfig // For 'monthly'
  startDate?: Date
  endDate?: Date
}

export interface EmailDigestConfig {
  format: DigestFormat
  includeAttendancePredictions: boolean
  includeOptimalSchedules: boolean
  includeMemberEngagement: boolean
  includeContentRecommendations: boolean
  includeStats: boolean
}

export interface ScheduledNotification {
  id: string
  churchId: string
  userId: string // Admin who created it
  recipientEmails: string[]
  title: string
  description?: string
  scheduleConfig: ScheduleConfig
  digestConfig: EmailDigestConfig
  status: NotificationStatus
  nextRunDate?: Date
  lastRunDate?: Date
  runCount: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
  metadata?: Record<string, unknown>
}

export interface ScheduledNotificationRun {
  id: string
  scheduledNotificationId: string
  churchId: string
  runDate: Date
  status: 'pending' | 'sent' | 'failed'
  sentTo: string[]
  failedRecipients?: string[]
  errorMessage?: string
  digestData?: {
    attendancePredictions?: Record<string, unknown>
    optimalSchedules?: Record<string, unknown>
    memberEngagement?: Record<string, unknown>
    contentRecommendations?: unknown[]
  }
  createdAt: Date
  completedAt?: Date
}

export interface EmailDigest {
  subject: string
  preheader: string
  churchName: string
  churchLogo?: string
  greeting: string
  sections: EmailDigestSection[]
  footerText: string
  unsubscribeUrl: string
  generatedAt: Date
}

export interface EmailDigestSection {
  title: string
  content: string
  icon?: string
  actionUrl?: string
  actionText?: string
  stats?: Array<{
    label: string
    value: string | number
  }>
}

export interface ScheduledNotificationCreateInput {
  recipientEmails: string[]
  title: string
  description?: string
  scheduleConfig: ScheduleConfig
  digestConfig: EmailDigestConfig
}

export interface ScheduledNotificationUpdateInput {
  recipientEmails?: string[]
  title?: string
  description?: string
  scheduleConfig?: ScheduleConfig
  digestConfig?: EmailDigestConfig
  status?: NotificationStatus
}
