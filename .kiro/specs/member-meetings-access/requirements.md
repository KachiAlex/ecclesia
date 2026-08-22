# Requirements Document

## Introduction

This feature addresses a permission issue where church members are incorrectly restricted from accessing the meetings tab. Members should be able to view and join meetings scheduled by administrators, but should not have the ability to create, edit, or delete meetings or manage livestream settings.

## Glossary

- **Member**: A church member with MEMBER role who should have read-only access to meetings
- **Administrator**: Users with ADMIN, SUPER_ADMIN, PASTOR, BRANCH_ADMIN, or LEADER roles who can manage meetings
- **Meetings Tab**: The navigation item that provides access to scheduled meetings and livestream functionality
- **Meeting Management**: The ability to create, edit, delete meetings and configure livestream settings

## Requirements

### Requirement 1

**User Story:** As a church member, I want to access the meetings tab, so that I can view scheduled meetings and join them when appropriate.

#### Acceptance Criteria

1. WHEN a user with MEMBER role navigates to the dashboard THEN the system SHALL display the meetings tab in the navigation menu
2. WHEN a member clicks on the meetings tab THEN the system SHALL allow access to the meetings page
3. WHEN a member views the meetings page THEN the system SHALL display all scheduled meetings they are authorized to see
4. WHEN a member views a meeting with a Google Meet link THEN the system SHALL display the "Join Google Meet" link for them to click
5. WHEN a member views the meetings page THEN the system SHALL NOT display any meeting creation, editing, or deletion controls

### Requirement 2

**User Story:** As a church member, I want to be restricted from managing meetings, so that only authorized personnel can schedule and modify church meetings.

#### Acceptance Criteria

1. WHEN a member views the meetings page THEN the system SHALL NOT display the "New Meeting" button
2. WHEN a member views individual meetings THEN the system SHALL NOT display "Edit" or "Delete" buttons
3. WHEN a member accesses the livestream tab THEN the system SHALL NOT display livestream management controls
4. WHEN a member views the Google Calendar integration section THEN the system SHALL NOT display the "Connect Google" button or calendar management options
5. WHEN a member attempts to access meeting management API endpoints THEN the system SHALL return appropriate authorization errors

### Requirement 3

**User Story:** As an administrator, I want to retain full meeting management capabilities, so that I can continue to schedule and manage church meetings effectively.

#### Acceptance Criteria

1. WHEN an administrator views the meetings page THEN the system SHALL display all meeting management controls including "New Meeting" button
2. WHEN an administrator views individual meetings THEN the system SHALL display "Edit" and "Delete" buttons
3. WHEN an administrator accesses the livestream tab THEN the system SHALL display all livestream management controls
4. WHEN an administrator views the Google Calendar integration THEN the system SHALL display connection and management options
5. WHEN an administrator uses meeting management features THEN the system SHALL function exactly as it currently does