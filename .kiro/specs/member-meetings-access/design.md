# Design Document

## Overview

This design addresses a simple but important permission fix in the church management system. Currently, members are incorrectly blocked from accessing the meetings tab entirely, when they should be able to view and join meetings while being restricted from management functions. The solution involves updating navigation permissions while preserving existing meeting management authorization logic.

## Architecture

The fix involves minimal changes to the existing architecture:

1. **Navigation Layer**: Update permission logic in navigation components to allow MEMBER role access to meetings tab
2. **Page Layer**: The existing meetings page already has proper authorization logic that distinguishes between viewing and managing
3. **Component Layer**: The MeetingsSchedule and related components already implement proper permission checks for management actions

## Components and Interfaces

### Navigation Components
- **DashboardNav.tsx**: Update `canSeeMeetings` logic to include MEMBER role
- **MobileDashboardLayout.tsx**: Uses DashboardNav, so inherits the fix automatically

### Page Components  
- **meetings/page.tsx**: Already has correct logic - no changes needed
- **MeetingsHub.tsx**: Already receives and uses proper permission props - no changes needed

### Meeting Components
- **MeetingsSchedule.tsx**: Already implements proper `canManageMeetings` checks - no changes needed
- **LivestreamHub.tsx**: Already implements proper `isAdmin` checks - no changes needed

## Data Models

No data model changes are required. The existing user role system and permission structure already support the desired behavior.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Member navigation access
*For any* user with MEMBER role, the meetings tab should be visible in the navigation menu and clicking it should allow access to the meetings page
**Validates: Requirements 1.1, 1.2**

### Property 2: Member meeting visibility
*For any* member viewing the meetings page, all scheduled meetings they are authorized to see should be displayed
**Validates: Requirements 1.3**

### Property 3: Member management controls restriction
*For any* member viewing the meetings page, no meeting management controls (New Meeting, Edit, Delete buttons) should be displayed
**Validates: Requirements 1.5, 2.1, 2.2**

### Property 4: Member Google Meet access
*For any* member viewing a meeting with a Google Meet link, the "Join Google Meet" link should be visible and clickable
**Validates: Requirements 1.4**

### Property 5: Member livestream restrictions
*For any* member accessing the livestream tab, no livestream management controls should be displayed
**Validates: Requirements 2.3**

### Property 6: Member Google Calendar restrictions
*For any* member viewing the meetings page, Google Calendar management controls (Connect Google button) should not be displayed
**Validates: Requirements 2.4**

### Property 7: Administrator functionality preservation
*For any* administrator user, all meeting management controls and functionality should remain visible and functional as before
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Error Handling

No new error handling is required. The existing API authorization will continue to prevent unauthorized access to management endpoints, providing appropriate error responses if members attempt to access restricted functionality.

## Testing Strategy

### Unit Testing
- Test navigation permission logic for different user roles
- Verify that MEMBER role now has access to meetings tab
- Confirm that management controls are properly hidden for members
- Ensure administrator functionality remains unchanged

### Property-Based Testing
Property-based tests will verify that the permission system works correctly across all user roles and scenarios. The testing framework will be Jest with property-based testing capabilities.

Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage of different user role combinations and meeting scenarios.

Property-based tests will be tagged with comments referencing the specific correctness properties from this design document using the format: '**Feature: member-meetings-access, Property {number}: {property_text}**'