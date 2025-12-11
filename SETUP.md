# Ecclesia Church App - Setup Guide

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- (Optional) OpenAI API key for AI features
- (Optional) Payment provider credentials (Stripe, Paystack, etc.)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecclesia?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-key-here"

# AI Services (Optional - for discipleship engine)
OPENAI_API_KEY="your-openai-api-key"

# File Upload
UPLOAD_MAX_SIZE="10485760"
UPLOAD_PATH="./public/uploads"

# QR Code Generation
QR_CODE_SECRET="your-qr-code-secret"

# Payment Gateway (Optional)
PAYMENT_PROVIDER="stripe"
PAYMENT_SECRET_KEY="your-payment-secret-key"
PAYMENT_PUBLIC_KEY="your-payment-public-key"

# Google Drive (Optional - for file uploads)
GOOGLE_DRIVE_CLIENT_ID="your-google-drive-client-id"
GOOGLE_DRIVE_CLIENT_SECRET="your-google-drive-client-secret"
GOOGLE_DRIVE_REFRESH_TOKEN="your-google-drive-refresh-token"
```

**Important**: Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or create migrations (for production)
npm run db:migrate
```

### 4. Create Initial Data (Optional)

You can use Prisma Studio to create initial data:
```bash
npm run db:studio
```

Or create a seed script in `prisma/seed.ts` and run:
```bash
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
ecclesia/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/             # Protected dashboard routes
│   │   └── dashboard/
│   ├── api/                     # API routes
│   │   └── auth/
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/                  # React components
│   ├── ui/                      # Reusable UI components
│   └── SignOutButton.tsx
├── lib/                         # Utilities
│   ├── prisma.ts               # Prisma client
│   └── utils.ts                # Helper functions
├── prisma/
│   └── schema.prisma           # Database schema
├── types/                      # TypeScript types
│   └── index.ts
├── middleware.ts               # Next.js middleware
└── package.json
```

## Key Features Implemented

### ✅ Foundation
- Next.js 14 with App Router
- TypeScript configuration
- Tailwind CSS styling
- Prisma ORM with PostgreSQL
- NextAuth.js authentication
- React Query for data fetching

### ✅ Authentication
- User registration
- Login/logout
- Protected routes
- Session management

### ✅ Database Schema
Complete Prisma schema with models for:
- Users & Roles
- Churches (multi-tenant)
- Departments & Groups
- AI Discipleship (Reading Plans, Coaching, Follow-ups)
- Social Network (Posts, Comments, Prayer Wall)
- Media & Sermons
- Giving & Projects
- Events & Check-ins
- Messaging
- Gamification (Badges, XP)
- Workforce Management

## Next Steps

1. **User & Member Management** - Complete profile management, role-based access
2. **AI Discipleship Engine** - Integrate OpenAI for coaching and recommendations
3. **Social Network** - Build community feed and prayer wall
4. **Sermon Hub** - Implement video streaming and AI summaries
5. **Giving System** - Integrate payment gateway
6. **Admin Dashboard** - Build analytics and management tools
7. **Gamification** - Implement badge system and leaderboards
8. **Real-time Features** - Add Socket.io for live updates

## Development Tips

- Use Prisma Studio to view/edit database: `npm run db:studio`
- Check TypeScript errors: `npm run lint`
- Database migrations: `npm run db:migrate`
- Generate Prisma Client after schema changes: `npm run db:generate`

## Production Deployment

1. Set up production PostgreSQL database
2. Update environment variables
3. Run database migrations
4. Build the application: `npm run build`
5. Start production server: `npm start`

## Support

For issues or questions, please refer to the documentation or create an issue in the repository.

