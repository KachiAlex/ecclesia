import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import { UserRole } from '@/types'

export type ApiGuardContext = {
  session: any
  userId: string
  role?: UserRole
  church?: any
}

export type ApiGuardOptions = {
  requireChurch?: boolean
  allowedRoles?: UserRole[]
}

export async function guardApi(options: ApiGuardOptions = {}): Promise<{ ok: true; ctx: ApiGuardContext } | { ok: false; response: NextResponse }> {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const userId = (session.user as any)?.id
  const role = (session.user as any)?.role as UserRole | undefined

  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (options.allowedRoles && options.allowedRoles.length > 0) {
    if (!role || !options.allowedRoles.includes(role)) {
      return { ok: false, response: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }) }
    }
  }

  let church: any | undefined
  if (options.requireChurch) {
    church = await getCurrentChurch(userId)
    if (!church) {
      return { ok: false, response: NextResponse.json({ error: 'No church selected' }, { status: 400 }) }
    }
  }

  return {
    ok: true,
    ctx: {
      session,
      userId,
      role,
      church,
    },
  }
}
