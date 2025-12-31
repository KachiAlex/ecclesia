export type UserRole =
  | 'MEMBER'
  | 'VISITOR'
  | 'VOLUNTEER'
  | 'LEADER'
  | 'PASTOR'
  | 'ADMIN'
  | 'BRANCH_ADMIN'
  | 'SUPER_ADMIN'
  | 'STAFF'

export type SpiritualMaturityLevel =
  | 'NEW_BELIEVER'
  | 'GROWING'
  | 'MATURE'
  | 'LEADER'

export type GivingType =
  | 'TITHE'
  | 'OFFERING'
  | 'THANKSGIVING'
  | 'SEED'
  | 'PROJECT'

export type EventType =
  | 'SERVICE'
  | 'MEETING'
  | 'CONFERENCE'
  | 'WORKSHOP'
  | 'SOCIAL'
  | 'OTHER'

export type BadgeType =
  | 'PRAYER_STREAK'
  | 'READING_PLAN'
  | 'GIVING'
  | 'EVENT_ATTENDANCE'
  | 'SERVING'
  | 'EVANGELISM'
  | 'OTHER'

export type PrayerStatus =
  | 'ACTIVE'
  | 'ANSWERED'
  | 'CLOSED'

// Member Invitation System Types
export * from './invitation'

// Survey System Types
export * from './survey'

