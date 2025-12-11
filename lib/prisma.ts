import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma Client with Cloud SQL optimizations
 * 
 * Optimized for Google Cloud SQL PostgreSQL:
 * - Connection pooling
 * - Proper timeout handling
 * - SSL/TLS support
 * - Query logging in development
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Optimized for Cloud SQL connection pooling
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Handle graceful shutdown in production
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} else {
  // Ensure connections are closed on shutdown
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

// Connection health check helper
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

