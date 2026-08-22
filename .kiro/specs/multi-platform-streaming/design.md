# Multi-Platform Livestream & Meeting Support - Design Document

## Overview

This design enables Ecclesia to support broadcasting livestreams and scheduling meetings across multiple platforms simultaneously. The system provides a unified interface for admins to manage multiple platform integrations and for members to access content on their preferred platforms.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Ecclesia Application                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Livestream UI   │         │  Meeting UI      │          │
│  │  (Admin/Member)  │         │  (Admin/Member)  │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                            │                     │
│  ┌────────▼────────────────────────────▼─────────┐          │
│  │     Platform Integration Service              │          │
│  │  - Restream Manager                           │          │
│  │  - Zoom Manager                               │          │
│  │  - Google Meet Manager                        │          │
│  │  - Teams Manager                              │          │
│  │  - Jitsi Manager                              │          │
│  └────────┬─────────────────────────────────────┘          │
│           │                                                  │
│  ┌────────▼──────────────────────────────────────┐          │
│  │     Platform Connection Manager               │          │
│  │  - OAuth Handlers                             │          │
│  │  - API Key Management                         │          │
│  │  - Token Refresh                              │          │
│  │  - Connection Status                          │          │
│  └────────┬──────────────────────────────────────┘          │
│           │                                                  │
└───────────┼──────────────────────────────────────────────────┘
            │
    ┌───────┴────────────────────────────────────┐
    │                                             │
┌───▼────────┐  ┌──────────┐  ┌──────────┐  ┌──▼──────┐
│  Restream  │  │  Zoom    │  │  Google  │  │ Teams   │
│   API      │  │   API    │  │  Meet    │  │  API    │
└────────────┘  └──────────┘  └──────────┘  └─────────┘
```

### Components

#### 1. Platform Integration Service
Manages connections and operations for each platform.

**Responsibilities:**
- Authenticate with platform APIs
- Create/update/delete livestreams and meetings
- Generate platform-specific links
- Handle platform-specific errors
- Manage platform-specific settings

**Supported Platforms:**
- Restream (livestream aggregator)
- Zoom (meetings)
- Google Meet (meetings)
- Microsoft Teams (meetings)
- Jitsi Meet (meetings)
- Instagram Live (livestream)
- YouTube Live (livestream)
- Facebook Live (livestream)

#### 2. Platform Connection Manager
Manages OAuth and API key authentication.

**Responsibilities:**
- Handle OAuth flows
- Store encrypted credentials
- Refresh expired tokens
- Validate connections
- Notify admins of connection issues

#### 3. Livestream Manager
Manages livestream creation and broadcasting.

**Responsibilities:**
- Create livestreams on multiple platforms
- Start/stop broadcasting
- Handle platform failures
- Track broadcast status
- Generate platform links

#### 4. Meeting Manager
Manages meeting scheduling on multiple platforms.

**Responsibilities:**
- Create meetings on multiple platforms
- Generate meeting links
- Update meeting details
- Cancel meetings
- Handle platform-specific settings

## Data Models

### Platform Connection
```typescript
interface PlatformConnection {
  id: string
  churchId: string
  platform: 'restream' | 'zoom' | 'google_meet' | 'teams' | 'jitsi' | 'instagram' | 'youtube' | 'facebook'
  status: 'connected' | 'disconnected' | 'expired' | 'error'
  credentials: {
    accessToken?: string
    refreshToken?: string
    apiKey?: string
    apiSecret?: string
    webhookSecret?: string
  }
  expiresAt?: Date
  lastError?: string
  createdAt: Date
  updatedAt: Date
}
```

### Livestream
```typescript
interface Livestream {
  id: string
  churchId: string
  title: string
  description?: string
  thumbnail?: string
  status: 'scheduled' | 'live' | 'ended'
  startAt: Date
  endAt?: Date
  platforms: {
    platform: string
    platformId?: string
    url?: string
    status: 'pending' | 'live' | 'ended' | 'failed'
    error?: string
    settings?: Record<string, any>
  }[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

### Meeting
```typescript
interface Meeting {
  id: string
  churchId: string
  title: string
  description?: string
  startAt: Date
  endAt: Date
  primaryPlatform: string
  platforms: {
    platform: string
    meetingId?: string
    url?: string
    status: 'pending' | 'active' | 'ended' | 'failed'
    error?: string
    settings?: Record<string, any>
  }[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

## API Endpoints

### Platform Connections
- `GET /api/platforms/connections` - List all platform connections
- `POST /api/platforms/connections/:platform/connect` - Start OAuth flow
- `POST /api/platforms/connections/:platform/callback` - OAuth callback
- `DELETE /api/platforms/connections/:platform` - Disconnect platform
- `GET /api/platforms/connections/:platform/status` - Check connection status

### Livestreams
- `GET /api/livestreams` - List livestreams
- `POST /api/livestreams` - Create livestream
- `GET /api/livestreams/:id` - Get livestream details
- `PATCH /api/livestreams/:id` - Update livestream
- `DELETE /api/livestreams/:id` - Delete livestream
- `POST /api/livestreams/:id/start` - Start broadcasting
- `POST /api/livestreams/:id/stop` - Stop broadcasting

### Meetings
- `GET /api/meetings` - List meetings (already exists)
- `POST /api/meetings` - Create meeting with multiple platforms
- `GET /api/meetings/:id` - Get meeting details
- `PATCH /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting

## UI Components

### Admin Features

#### Platform Management
- Connect/disconnect platforms
- View connection status
- Handle OAuth flows
- Display connection errors

#### Livestream Creation
- Select platforms to broadcast to
- Configure platform-specific settings
- Set title, description, thumbnail
- Schedule or start immediately
- View broadcast status

#### Meeting Creation
- Select platforms for meeting
- Set primary platform
- Configure platform-specific settings
- Generate meeting links
- View meeting status

### Member Features

#### Livestream Viewing
- See all active livestreams
- View links to all available platforms
- Click to join on preferred platform
- See platform status

#### Meeting Joining
- See scheduled meetings
- View links to all available platforms
- See primary platform highlighted
- Click to join on preferred platform

## Error Handling

### Platform Failures
- Log all platform errors
- Continue with other platforms if one fails
- Notify admin of failures
- Provide retry mechanism
- Display fallback options to members

### Connection Issues
- Detect expired tokens
- Attempt automatic refresh
- Notify admin if refresh fails
- Provide manual reconnection option

### Rate Limiting
- Implement exponential backoff
- Queue requests if rate limited
- Notify admin of rate limit issues

## Security Considerations

### Credential Storage
- Encrypt all API keys and tokens
- Use environment variables for secrets
- Implement key rotation
- Audit credential access

### OAuth Security
- Use PKCE for OAuth flows
- Validate state parameters
- Implement CSRF protection
- Secure redirect URIs

### API Security
- Validate all inputs
- Implement rate limiting
- Use HTTPS for all requests
- Implement request signing where required

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Platform Connection Consistency
**For any** platform connection, if the connection status is "connected", then the stored credentials must be valid and non-empty.
**Validates: Requirements 4.1, 4.2**

### Property 2: Livestream Multi-Platform Broadcasting
**For any** livestream with multiple platforms selected, when broadcasting starts, the system must attempt to broadcast to all selected platforms.
**Validates: Requirements 1.2, 1.3**

### Property 3: Meeting Link Generation
**For any** meeting scheduled on multiple platforms, the system must generate valid meeting links for each platform.
**Validates: Requirements 2.2, 2.3**

### Property 4: Platform Failure Isolation
**For any** livestream or meeting, if one platform fails, the system must continue operating on other platforms without interruption.
**Validates: Requirements 1.4, 7.1**

### Property 5: Member Platform Access
**For any** member viewing a livestream or meeting, all available platform links must be displayed and functional.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 6: Connection Status Accuracy
**For any** platform connection, the displayed status must accurately reflect the current connection state (connected, disconnected, expired, error).
**Validates: Requirements 4.1, 4.4**

### Property 7: Credential Encryption
**For any** stored platform credential, the credential must be encrypted at rest and decrypted only when needed for API calls.
**Validates: Requirements 4.2, Security Considerations**

### Property 8: Primary Platform Highlighting
**For any** meeting with multiple platforms, the primary platform must be visually distinguished from alternative platforms in the member UI.
**Validates: Requirements 5.5**

## Error Handling Strategy

### Unit Testing
- Test each platform integration independently
- Test credential storage and retrieval
- Test OAuth flows
- Test error scenarios

### Property-Based Testing
- Generate random platform configurations
- Verify properties hold across all configurations
- Test failure scenarios
- Verify fallback behavior

### Integration Testing
- Test multi-platform broadcasting
- Test meeting creation across platforms
- Test connection management
- Test member access

## Testing Strategy

### Unit Tests
- Platform-specific API calls
- Credential encryption/decryption
- OAuth flow handling
- Error handling and retries

### Property-Based Tests
- Platform connection consistency
- Multi-platform broadcasting
- Meeting link generation
- Platform failure isolation
- Member platform access
- Connection status accuracy
- Credential encryption
- Primary platform highlighting

### Integration Tests
- End-to-end livestream creation and broadcasting
- End-to-end meeting creation and joining
- Platform connection management
- Member access to multiple platforms
- Error recovery and fallback

## Implementation Phases

### Phase 1: Platform Infrastructure (Week 1-2)
- Create platform connection management
- Implement OAuth flows
- Create credential storage
- Implement platform base classes

### Phase 2: Livestream Support (Week 2-3)
- Implement Restream integration
- Implement Instagram Live integration
- Implement YouTube Live integration
- Implement Facebook Live integration
- Create livestream UI

### Phase 3: Meeting Support (Week 3-4)
- Implement Zoom integration
- Implement Google Meet integration (enhance existing)
- Implement Teams integration
- Implement Jitsi Meet integration
- Create meeting UI with multi-platform support

### Phase 4: Advanced Features (Week 4-5)
- Recording support
- Analytics
- Chat moderation
- Scheduled broadcasts
- Platform-specific branding

## Dependencies

### External Services
- Restream API
- Zoom API
- Microsoft Teams API
- Jitsi Meet API
- Instagram Graph API
- YouTube API
- Facebook Graph API

### Libraries
- OAuth 2.0 libraries
- Encryption libraries
- HTTP client libraries
- Queue/job processing libraries

## Performance Considerations

- Implement caching for platform connections
- Use background jobs for platform operations
- Implement connection pooling
- Optimize API calls to reduce rate limiting
- Implement request queuing for high-volume scenarios

## Monitoring & Observability

- Log all platform API calls
- Track platform-specific errors
- Monitor connection status
- Alert on platform failures
- Track broadcast/meeting metrics
