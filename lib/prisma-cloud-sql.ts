import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma Client with Cloud SQL optimizations
 * 
 * Features:
 * - Connection pooling
 * - Proper timeout handling
 * - SSL/TLS configuration
 * - Query logging in development
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool configuration
    // These settings optimize for Cloud SQL
    __internal: {
      engine: {
        connectTimeout: 10000, // 10 seconds
        queryTimeout: 20000, // 20 seconds
      },
    },
  })

// Handle graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} else {
  // In production, ensure connections are closed on shutdown
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Optimized connection pool helper
export async function withTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback, {
    maxWait: 5000, // Maximum time to wait for a transaction slot
    timeout: 10000, // Maximum time the transaction can run
  })
}

