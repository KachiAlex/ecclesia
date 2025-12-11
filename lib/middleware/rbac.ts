import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { Permission, hasPermission, requirePermission } from '@/lib/permissions'
import { UserRole } from '@/types'

/**
 * Middleware to check if user has required permission
 */
export async function requirePermissionMiddleware(permission: Permission) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
      user: null,
    }
  }

  const userRole = (session.user as any).role as UserRole

  if (!hasPermission(userRole, permission)) {
    return {
      error: NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      ),
      user: session.user,
    }
  }

  return {
    error: null,
    user: session.user,
  }
}

/**
 * Middleware to check if user has any of the required permissions
 */
export async function requireAnyPermissionMiddleware(permissions: Permission[]) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
      user: null,
    }
  }

  const userRole = (session.user as any).role as UserRole

  const hasAny = permissions.some((permission) =>
    hasPermission(userRole, permission)
  )

  if (!hasAny) {
    return {
      error: NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      ),
      user: session.user,
    }
  }

  return {
    error: null,
    user: session.user,
  }
}

/**
 * Wrapper for API routes that require specific permissions
 */
export function withPermission(
  permission: Permission,
  handler: (request: Request, user: any) => Promise<NextResponse>
) {
  return async (request: Request) => {
    const { error, user } = await requirePermissionMiddleware(permission)

    if (error) {
      return error
    }

    return handler(request, user)
  }
}

/**
 * Wrapper for API routes that require any of the specified permissions
 */
export function withAnyPermission(
  permissions: Permission[],
  handler: (request: Request, user: any) => Promise<NextResponse>
) {
  return async (request: Request) => {
    const { error, user } = await requireAnyPermissionMiddleware(permissions)

    if (error) {
      return error
    }

    return handler(request, user)
  }
}

