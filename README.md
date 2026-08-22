# Ecclesia Church App

A comprehensive church management and community application with AI-powered discipleship features.

## Features

### 🟦 1. User & Member Management
- Role-based access control (Member, Visitor, Leader, Pastor, Admin, Super Admin)
- Digital profiles with spiritual metrics
- Visitor to member conversion

### 🟩 2. AI-Powered Discipleship Engine
- Personalized spiritual growth plans
- AI Spiritual Coach
- Automated follow-up system for new converts

### 🟧 3. Church Social Network
- Community feed with testimonies, photos, updates
- Groups/Departments with chat and media
- Prayer wall with real-time reactions

### 🟪 4. Advanced Media & Sermon Hub
- Netflix-style sermon streaming
- AI sermon summaries and topic search
- Offline downloads

### 🟫 5. Hybrid Church Experience
- Smart service check-in via QR codes
- Digital membership card
- Location-based small group matching

### 🟨 6. Giving & Financial Transparency
- Project-based giving with progress tracking
- Regular giving (tithes, offerings, etc.)
- Auto-generated PDF receipts
- Member financial dashboard

### 🟦 7. Leadership & Admin Dashboard
- Engagement analytics
- Workforce management
- First-timer pipeline

### 🟧 8. Children & Family Module
- Parent dashboard
- Secure children check-in
- Family devotion mode

### 🟥 9. Event System
- Smart event calendar
- Event registration with limited slots
- Ticketing system

### 🟩 10. Gamification System
- Spiritual badges
- Leaderboards (global, departments, groups, families)
- XP levels based on participation

### 🟦 11. Messaging & Communication
- Private messages
- Group chats
- Broadcast messaging

### 🟫 12. Multi-Church Support (SaaS)
- Church switching
- Custom branding
- Church admin portal

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io
- **State Management**: React Query

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
ecclesia/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
├── lib/                   # Utilities and helpers
├── prisma/               # Database schema
├── types/                # TypeScript types
└── public/               # Static assets
```

## License

Private - All rights reserved

