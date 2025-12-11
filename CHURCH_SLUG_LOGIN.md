# Church Slug Login Feature

## 🎯 Overview

Churches can now login directly from the home page using their church name (slug) and then their username/password. This provides a branded, church-specific login experience.

## 🔄 Login Flow

### Step 1: Enter Church Name on Home Page
- User visits the home page (`/`)
- Enters their church name (slug) in the "Church Login" form
- Examples: `grace-community-church`, `first-baptist`, `st-marys`

### Step 2: Navigate to Church Login Page
- User is redirected to `/login/[slug]`
- Page validates that the church exists
- Shows church name if found
- Displays login form for that specific church

### Step 3: Enter Credentials
- User enters their email and password
- System verifies:
  1. Email exists
  2. Password is correct
  3. **User belongs to the church with that slug** ⭐

### Step 4: Access Dashboard
- On successful login, user is redirected to `/dashboard`
- Session includes user's church context

## 🏗️ Implementation Details

### Home Page (`app/page.tsx`)
- Added `ChurchLoginForm` component
- Form accepts church slug input
- Redirects to `/login/[slug]` on submit

### Church Login Page (`app/login/[slug]/page.tsx`)
- Dynamic route: `/login/[slug]`
- Validates church exists via API
- Shows church name if found
- Displays email/password login form
- Passes `churchSlug` to authentication

### API Route (`app/api/churches/slug/[slug]/route.ts`)
- `GET /api/churches/slug/[slug]`
- Returns church info (name, slug, location)
- Used to validate church exists before showing login form

### Authentication (`lib/auth-options.ts`)
- Updated `CredentialsProvider` to accept `churchSlug`
- Verifies user belongs to the church:
  1. Finds church by slug
  2. Checks user's `churchId` matches church `id`
  3. Rejects login if mismatch

## 🔒 Security Features

1. **Church Validation**: Verifies church exists before showing login form
2. **User-Church Matching**: Ensures user belongs to the church they're logging into
3. **Password Verification**: Standard bcrypt password checking
4. **Error Handling**: Clear error messages for invalid credentials or church mismatch

## 📋 Example Usage

### Scenario: Grace Community Church Login

1. **Home Page**:
   ```
   User enters: "grace-community-church"
   Clicks: "Continue to Login"
   ```

2. **Church Login Page** (`/login/grace-community-church`):
   ```
   Shows: "Welcome to Grace Community Church"
   User enters:
   - Email: pastor@gracechurch.com
   - Password: ********
   ```

3. **Authentication**:
   ```
   System checks:
   ✓ Church "grace-community-church" exists
   ✓ User email exists
   ✓ Password is correct
   ✓ User belongs to Grace Community Church
   ```

4. **Success**:
   ```
   Redirects to: /dashboard
   User is logged in with church context
   ```

## 🎨 UI Components

### `ChurchLoginForm` (Home Page)
- Simple form with church slug input
- Placeholder: "e.g., grace-community-church"
- Helpful hint text
- Redirects to church-specific login page

### Church Login Page
- Shows church name when found
- Displays slug: `/grace-community-church`
- Standard email/password form
- Error handling for invalid church or credentials
- Link back to home page

## 🔄 Alternative Login Methods

### Standard Admin Login
- Route: `/auth/login`
- No church slug required
- For platform admins or users who know their email

### Church-Specific Login
- Route: `/login/[slug]`
- Requires church slug first
- Then email/password
- Verifies user belongs to that church

## 🛠️ Technical Notes

### Slug Format
- Generated from church name during registration
- Lowercase, hyphenated
- Example: "Grace Community Church" → "grace-community-church"
- Unique per church

### Authentication Flow
```typescript
// When churchSlug is provided:
1. Find church by slug
2. Find user by email
3. Verify password
4. Verify user.churchId === church.id
5. Create session with user + church context
```

### Error Cases
- **Church not found**: Shows error, prevents login
- **User not found**: Standard "Invalid credentials" message
- **Wrong password**: Standard "Invalid credentials" message
- **User belongs to different church**: Login rejected (no error details for security)

## 📝 Files Modified/Created

### Created
- `app/login/[slug]/page.tsx` - Church-specific login page
- `app/api/churches/slug/[slug]/route.ts` - Church validation API

### Modified
- `app/page.tsx` - Added church login form
- `lib/auth-options.ts` - Added church slug verification

## 🚀 Benefits

1. **Branded Experience**: Each church has its own login URL
2. **Security**: Ensures users can only login to their own church
3. **User-Friendly**: Simple flow: church name → credentials
4. **Multi-Tenant**: Supports multiple churches on same platform
5. **Flexible**: Still supports standard email/password login

## 🔮 Future Enhancements

- [ ] Custom church branding on login page
- [ ] Remember church slug for returning users
- [ ] Church-specific password reset flow
- [ ] QR code login for church members
- [ ] SSO integration per church

