# Multi-Tenant Church Management Platform - Complete Guide

## 🏗️ Architecture Overview

### Core Concept
- **Churches = Tenants** - Each church organization is an isolated tenant
- **Multi-Tenant SaaS** - One platform, multiple church organizations
- **Trial System** - Every new church gets a **30-day free trial**
- **Admin Management** - Church admins can create accounts for their members

## 🔄 Registration Flow

### Step-by-Step Process

1. **User visits** `/auth/register`
2. **Fills out form**:
   - Personal info (name, email, password)
   - **Church organization** (church name, city, country) ⭐ **REQUIRED**
3. **System automatically**:
   - Creates church organization with unique slug
   - Creates user account with **ADMIN** role
   - Links user as church **owner**
   - Creates **FREE plan** (if doesn't exist)
   - Creates **30-day TRIAL subscription**
   - Sets trial end date (30 days from registration)
4. **User receives**:
   - Confirmation message with trial end date
   - Redirected to login
5. **After login**:
   - Sees their church dashboard
   - Can manage their church organization
   - Can create accounts for church members

## 🎫 30-Day Free Trial

### Trial Details
- **Duration**: 30 days from registration
- **Status**: `TRIAL`
- **Plan**: FREE plan with limited features
- **Limits**:
  - Max 50 users
  - 5 GB storage
  - 20 sermons
  - 10 events/month
  - 5 departments
  - 10 groups

### Trial Management
- Trial automatically expires after 30 days
- Status changes to `EXPIRED` if not upgraded
- Superadmin can extend or manage trials
- Churches can upgrade to paid plans before trial ends

## 👥 User Roles & Permissions

### Role Hierarchy
1. **SUPER_ADMIN** - Platform administrator
   - Can manage all churches
   - Access to superadmin portal
   - Full platform control

2. **ADMIN** - Church administrator (church owner)
   - Manages their church organization
   - Can create accounts for members
   - Full church management
   - Can assign roles to members

3. **PASTOR** - Church pastor
   - Manages church operations
   - Can create member accounts
   - Manages departments, groups, sermons

4. **LEADER** - Department/group leader
   - Manages their department/group
   - Limited user management

5. **MEMBER** - Regular church member
   - Access to church features
   - Can participate in activities

6. **VISITOR** - New/visiting member
   - Limited access
   - Can be converted to member

## 🔐 Admin User Creation

### How Admins Create Member Accounts

**API Endpoint**: `POST /api/users`

**Required Permissions**:
- User must be `ADMIN`, `PASTOR`, or `SUPER_ADMIN`
- User must belong to a church

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "secure-password",
  "role": "MEMBER" // Optional, defaults to MEMBER
}
```

**Features**:
- ✅ Checks usage limits (max users on plan)
- ✅ Validates permissions (can't create SUPER_ADMIN)
- ✅ Automatically assigns to admin's church
- ✅ Enforces role hierarchy (admins can't create roles above their level)

**Usage Limit Check**:
- Before creating user, system checks if church has reached max users
- Returns error if limit reached
- Shows current usage vs limit

## 📊 Superadmin Portal

### Access
- URL: `/superadmin`
- Only accessible to `SUPER_ADMIN` role
- Unauthorized users redirected to `/dashboard`

### Features

#### 1. Dashboard (`/superadmin`)
- Platform overview statistics
- Total churches, users, subscriptions
- Recent churches list
- Quick action cards

#### 2. Churches Management (`/superadmin/churches`)
- List all church organizations
- View church details:
  - Church info (name, location, slug)
  - Member count
  - Subscription status
  - Owner information
  - Created date

#### 3. Subscriptions (`/superadmin/subscriptions`)
- View all subscription plans
- Manage church subscriptions
- View subscription statuses

#### 4. Analytics (`/superadmin/analytics`)
- Platform-wide metrics
- Growth statistics
- Usage analytics

## 🔧 Technical Implementation

### Database Structure

**Church Model**:
```typescript
{
  id: string
  name: string
  slug: string (unique)
  ownerId: string (user who registered)
  email: string
  city: string
  country: string
  createdAt: Date
  updatedAt: Date
}
```

**Subscription Model**:
```typescript
{
  id: string
  churchId: string (unique)
  planId: string
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  startDate: Date
  endDate: Date
  trialEndsAt: Date (for trials)
}
```

**User Model**:
```typescript
{
  id: string
  email: string (unique)
  firstName: string
  lastName: string
  role: UserRole
  churchId: string (tenant isolation)
  password: string (hashed)
}
```

### Key Services

1. **ChurchService**
   - `create()` - Create church organization
   - `findById()` - Get church by ID
   - `findBySlug()` - Get church by slug
   - `findAll()` - Get all churches (superadmin)
   - `generateSlug()` - Generate URL-friendly slug

2. **SubscriptionService**
   - `create()` - Create subscription
   - `findByChurch()` - Get church subscription
   - Trial period management

3. **UserService**
   - `create()` - Create user account
   - `findByChurch()` - Get church members
   - `findByEmail()` - Find user by email
   - Admin user creation with permission checks

## 🚀 Usage Examples

### Creating a Church (Registration)
```typescript
POST /api/auth/register
{
  "firstName": "Pastor",
  "lastName": "Smith",
  "email": "pastor@gracechurch.com",
  "password": "secure123",
  "churchName": "Grace Community Church",
  "churchCity": "New York",
  "churchCountry": "United States"
}

// Response:
{
  "user": { ... },
  "church": { ... },
  "trialEndsAt": "2025-01-10T00:00:00Z",
  "message": "Church organization and account created successfully. You have a 30-day free trial."
}
```

### Admin Creating Member Account
```typescript
POST /api/users
Headers: { Authorization: "Bearer <token>" }
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@gracechurch.com",
  "password": "member123",
  "role": "MEMBER"
}

// Response:
{
  "user": { ... },
  "message": "User created successfully"
}
```

## 📋 Checklist for New Churches

When a church registers:
- [x] Church organization created
- [x] Unique slug generated
- [x] Owner account created (ADMIN role)
- [x] Church linked to owner
- [x] FREE plan created/assigned
- [x] 30-day trial subscription created
- [x] Trial end date set (30 days from now)
- [x] Owner can now create member accounts

## 🎯 Next Steps

1. **Trial Expiration Handling**
   - Add notification system (email reminders)
   - Auto-disable features when trial expires
   - Upgrade prompts

2. **Admin User Management UI**
   - Build UI for admins to create members
   - Member list with management options
   - Bulk import capabilities

3. **Subscription Management**
   - Upgrade/downgrade flows
   - Payment integration
   - Billing management

4. **Superadmin Enhancements**
   - Church suspension/activation
   - Trial extension
   - Bulk operations
   - Advanced analytics

## 📝 Important Notes

- **Tenant Isolation**: All data is scoped by `churchId`
- **Slug Uniqueness**: Auto-generated slugs ensure uniqueness
- **Trial Period**: Fixed 30 days, cannot be changed during registration
- **User Limits**: Enforced based on subscription plan
- **Role Hierarchy**: Admins can only create roles they can manage
- **Superadmin Access**: Only SUPER_ADMIN role can access superadmin portal

## 🔒 Security

- All routes protected by authentication
- Role-based access control (RBAC)
- Tenant isolation enforced at database level
- Usage limits checked before resource creation
- Permission checks for all admin operations
