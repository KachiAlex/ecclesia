# Livestream API Reference

## Overview
The Livestream API enables churches to broadcast to multiple platforms simultaneously and manage member access.

## Authentication
All endpoints require authentication via NextAuth session.

## Endpoints

### Create Livestream
```
POST /api/livestreams
Content-Type: application/json
Authorization: Bearer <session_token>

Request Body:
{
  "title": "Sunday Service",
  "description": "Weekly Sunday service",
  "thumbnail": "https://example.com/thumbnail.jpg",
  "startAt": "2025-01-05T10:00:00Z",
  "platforms": [
    {
      "platform": "RESTREAM",
      "settings": {
        "title": "Sunday Service - Restream",
        "description": "Watch on Restream"
      }
    },
    {
      "platform": "YOUTUBE",
      "settings": {
        "title": "Sunday Service - YouTube",
        "description": "Watch on YouTube"
      }
    }
  ]
}

Response (201 Created):
{
  "success": true,
  "data": {
    "id": "livestream-123",
    "churchId": "church-456",
    "title": "Sunday Service",
    "description": "Weekly Sunday service",
    "thumbnail": "https://example.com/thumbnail.jpg",
    "status": "SCHEDULED",
    "startAt": "2025-01-05T10:00:00Z",
    "endAt": null,
    "createdBy": "user-789",
    "createdAt": "2025-01-03T15:30:00Z",
    "updatedAt": "2025-01-03T15:30:00Z"
  },
  "message": "Livestream created successfully"
}
```

### List Livestreams
```
GET /api/livestreams?status=LIVE
Authorization: Bearer <session_token>

Query Parameters:
- status (optional): SCHEDULED, LIVE, or ENDED

Response (200 OK):
{
  "success": true,
  "data": [
    {
      "id": "livestream-123",
      "churchId": "church-456",
      "title": "Sunday Service",
      "status": "LIVE",
      ...
    }
  ]
}
```

### Get Livestream Details
```
GET /api/livestreams/livestream-123
Authorization: Bearer <session_token>

Response (200 OK):
{
  "success": true,
  "data": {
    "id": "livestream-123",
    "churchId": "church-456",
    "title": "Sunday Service",
    "status": "LIVE",
    ...
  }
}
```

### Update Livestream
```
PATCH /api/livestreams/livestream-123
Content-Type: application/json
Authorization: Bearer <session_token>

Request Body:
{
  "title": "Updated Sunday Service",
  "description": "Updated description",
  "thumbnail": "https://example.com/new-thumbnail.jpg"
}

Response (200 OK):
{
  "success": true,
  "data": { ... },
  "message": "Livestream updated successfully"
}
```

### Start Broadcasting
```
POST /api/livestreams/livestream-123/start
Authorization: Bearer <session_token>

Response (200 OK):
{
  "success": true,
  "data": {
    "id": "livestream-123",
    "status": "LIVE",
    ...
  },
  "message": "Broadcasting started on all platforms"
}
```

### Stop Broadcasting
```
POST /api/livestreams/livestream-123/stop
Authorization: Bearer <session_token>

Response (200 OK):
{
  "success": true,
  "data": {
    "id": "livestream-123",
    "status": "ENDED",
    "endAt": "2025-01-05T11:00:00Z",
    ...
  },
  "message": "Broadcasting stopped on all platforms"
}
```

### Get Platform Links (For Members)
```
GET /api/livestreams/livestream-123/platforms

Response (200 OK):
{
  "success": true,
  "data": [
    {
      "platform": "RESTREAM",
      "url": "https://restream.io/channel/abc123",
      "status": "LIVE",
      "error": null
    },
    {
      "platform": "YOUTUBE",
      "url": "https://youtube.com/watch?v=xyz789",
      "status": "LIVE",
      "error": null
    },
    {
      "platform": "FACEBOOK",
      "url": null,
      "status": "FAILED",
      "error": "Connection expired"
    }
  ]
}
```

### Delete Livestream
```
DELETE /api/livestreams/livestream-123
Authorization: Bearer <session_token>

Response (200 OK):
{
  "success": true,
  "message": "Livestream deleted successfully"
}
```

## Platform Enums

### StreamingPlatform
- `RESTREAM` - Restream (multi-platform aggregator)
- `ZOOM` - Zoom
- `GOOGLE_MEET` - Google Meet
- `TEAMS` - Microsoft Teams
- `JITSI` - Jitsi Meet
- `INSTAGRAM` - Instagram Live
- `YOUTUBE` - YouTube Live
- `FACEBOOK` - Facebook Live

### LivestreamStatus
- `SCHEDULED` - Livestream is scheduled but not yet live
- `LIVE` - Livestream is currently broadcasting
- `ENDED` - Livestream has ended

### LivestreamPlatformStatus
- `PENDING` - Platform is pending (not yet started)
- `LIVE` - Platform is broadcasting
- `ENDED` - Platform broadcast has ended
- `FAILED` - Platform broadcast failed

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields: title, startAt, platforms"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Livestream not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create livestream"
}
```

## Permissions

### Create/Update/Delete Livestream
- Required roles: ADMIN, PASTOR, LEADER

### Start/Stop Broadcasting
- Required roles: ADMIN, PASTOR, LEADER

### View Livestreams
- Required roles: All authenticated users

### Get Platform Links (Members)
- Required: None (public endpoint)

## Rate Limiting
- No rate limiting currently implemented
- Recommended: 100 requests per minute per user

## Webhooks (Future)
- `livestream.created` - Fired when livestream is created
- `livestream.started` - Fired when broadcasting starts
- `livestream.stopped` - Fired when broadcasting stops
- `livestream.deleted` - Fired when livestream is deleted
- `platform.failed` - Fired when platform broadcast fails

## Examples

### JavaScript/TypeScript
```typescript
// Create livestream
const response = await fetch('/api/livestreams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Sunday Service',
    startAt: new Date().toISOString(),
    platforms: [
      { platform: 'RESTREAM' },
      { platform: 'YOUTUBE' }
    ]
  })
})

const { data } = await response.json()

// Start broadcasting
await fetch(`/api/livestreams/${data.id}/start`, {
  method: 'POST'
})

// Get platform links for members
const linksResponse = await fetch(`/api/livestreams/${data.id}/platforms`)
const { data: links } = await linksResponse.json()

// Display links to members
links.forEach(link => {
  if (link.status === 'LIVE') {
    console.log(`Join on ${link.platform}: ${link.url}`)
  }
})
```

### cURL
```bash
# Create livestream
curl -X POST http://localhost:3000/api/livestreams \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sunday Service",
    "startAt": "2025-01-05T10:00:00Z",
    "platforms": [
      {"platform": "RESTREAM"},
      {"platform": "YOUTUBE"}
    ]
  }'

# Start broadcasting
curl -X POST http://localhost:3000/api/livestreams/livestream-123/start

# Get platform links
curl http://localhost:3000/api/livestreams/livestream-123/platforms
```

## Best Practices

1. **Always validate platform connections before creating livestream**
   - Check that all selected platforms are connected
   - Handle connection errors gracefully

2. **Use platform-specific settings**
   - Customize titles, descriptions, thumbnails per platform
   - Optimize for each platform's requirements

3. **Monitor platform status**
   - Check platform links endpoint regularly
   - Handle failed platforms gracefully
   - Notify admins of failures

4. **Handle errors gracefully**
   - Implement retry logic for failed operations
   - Provide clear error messages to users
   - Log all errors for debugging

5. **Optimize for performance**
   - Cache platform connections
   - Use background jobs for long-running operations
   - Implement request queuing for high-volume scenarios

## Troubleshooting

### Platform Connection Failed
- Verify credentials are correct
- Check if token has expired
- Refresh token if needed
- Reconnect platform

### Broadcasting Not Starting
- Verify all platforms are connected
- Check platform status
- Review error messages
- Check platform API status

### Platform Links Not Showing
- Verify livestream is live
- Check platform status
- Verify platform connection
- Check for platform-specific errors

## Support
For issues or questions, contact the development team.
