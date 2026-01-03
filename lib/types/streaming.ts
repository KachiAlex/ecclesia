// Multi-Platform Streaming Types

export enum StreamingPlatform {
  RESTREAM = 'RESTREAM',
  ZOOM = 'ZOOM',
  GOOGLE_MEET = 'GOOGLE_MEET',
  TEAMS = 'TEAMS',
  JITSI = 'JITSI',
  INSTAGRAM = 'INSTAGRAM',
  YOUTUBE = 'YOUTUBE',
  FACEBOOK = 'FACEBOOK',
}

export enum PlatformConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  EXPIRED = 'EXPIRED',
  ERROR = 'ERROR',
}

export enum LivestreamStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
}

export enum LivestreamPlatformStatus {
  PENDING = 'PENDING',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  FAILED = 'FAILED',
}

export interface PlatformCredentials {
  accessToken?: string
  refreshToken?: string
  apiKey?: string
  apiSecret?: string
  webhookSecret?: string
}

export interface PlatformConnectionData {
  id: string
  churchId: string
  platform: StreamingPlatform
  status: PlatformConnectionStatus
  credentials: PlatformCredentials
  expiresAt?: Date
  lastError?: string
  lastErrorAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface LivestreamPlatformSettings {
  title?: string
  description?: string
  thumbnail?: string
  [key: string]: any
}

export interface LivestreamData {
  id: string
  churchId: string
  title: string
  description?: string
  thumbnail?: string
  status: LivestreamStatus
  startAt: Date
  endAt?: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface MeetingData {
  id: string
  churchId: string
  title: string
  description?: string
  status: string
  startAt: Date
  endAt: Date
  primaryPlatform?: StreamingPlatform
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
