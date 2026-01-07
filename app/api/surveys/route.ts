import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { SurveyService } from '@/lib/services/survey-service'
import { prisma } from '@/lib/prisma'
import { getCurrentChurchId } from '@/lib/church-context'
import { ChurchService, generateSlug } from '@/lib/services/church-service'
import { UserService } from '@/lib/services/user-service'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function resolveChurchId(
  providedChurchId: string | null,
  sessionUserId?: string,
  sessionUserChurchId?: string | null
): Promise<string | null> {
  const candidates: Array<string | null | undefined> = [
    providedChurchId,
    sessionUserChurchId
  ]

  if (sessionUserId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { churchId: true }
    })
    candidates.push(dbUser?.churchId)
  }

  candidates.push(await getCurrentChurchId(sessionUserId))

  for (const candidate of candidates) {
    if (!candidate) continue
    const ensuredChurchId = await ensureChurchRecord(candidate)
    if (ensuredChurchId) {
      return ensuredChurchId
    }
  }

  return null
}

async function ensureChurchRecord(churchId: string): Promise<string | null> {
  const existing = await prisma.church.findUnique({
    where: { id: churchId },
    select: { id: true }
  })

  if (existing) {
    return existing.id
  }

  try {
    const remoteChurch = await ChurchService.findById(churchId)
    if (!remoteChurch) {
      return null
    }

    const slugSource =
      remoteChurch.slug ||
      (remoteChurch.name ? generateSlug(remoteChurch.name) : `church-${churchId.slice(0, 6)}`)

    const created = await prisma.church.create({
      data: {
        id: churchId,
        name: remoteChurch.name || 'Untitled Church',
        slug: slugSource,
        logo: remoteChurch.logo || null,
        primaryColor: remoteChurch.primaryColor || null,
        secondaryColor: remoteChurch.secondaryColor || null,
        address: remoteChurch.address || null,
        city: remoteChurch.city || null,
        state: remoteChurch.state || null,
        zipCode: remoteChurch.zipCode || null,
        country: remoteChurch.country || null,
        phone: remoteChurch.phone || null,
        email: remoteChurch.email || remoteChurch.organizationEmail || null,
        website: remoteChurch.website || null,
        description: remoteChurch.description || remoteChurch.tagline || null,
        customDomain: remoteChurch.customDomain || null,
        domainVerified: remoteChurch.domainVerified ?? false
      }
    })

    return created.id
  } catch (error) {
    console.error('Failed to ensure church record:', error)
    return null
  }
}

interface SessionUserFallback {
  id?: string | null
  email?: string | null
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  churchId?: string | null
}

async function ensureUserRecord(
  userId: string | null | undefined,
  fallbackUser?: SessionUserFallback
): Promise<string | null> {
  let resolvedUserId = userId ?? fallbackUser?.id ?? null
  let remoteUser = resolvedUserId ? await UserService.findById(resolvedUserId).catch(() => null) : null

  if (!resolvedUserId && fallbackUser?.email) {
    remoteUser = await UserService.findByEmail(fallbackUser.email).catch(() => null)
    if (remoteUser) {
      resolvedUserId = remoteUser.id
    }
  }

  if (!resolvedUserId && fallbackUser?.email) {
    // Use deterministic pseudo-id derived from email to allow consistent lookups
    resolvedUserId = `email:${fallbackUser.email.trim().toLowerCase()}`
  }

  if (!resolvedUserId) {
    return null
  }

  const existing = await prisma.user.findUnique({
    where: { id: resolvedUserId },
    select: { id: true }
  })

  if (existing) {
    return existing.id
  }

  try {
    if (!remoteUser && resolvedUserId) {
      remoteUser = await UserService.findById(resolvedUserId).catch(() => null)
    }

    const baseUser =
      remoteUser ||
      (fallbackUser
        ? {
            id: resolvedUserId,
            email:
              fallbackUser.email ||
              (resolvedUserId ? `${resolvedUserId}@ecclesia.local` : null),
            firstName: fallbackUser.firstName || fallbackUser.name?.split(' ')?.[0] || 'Member',
            lastName:
              fallbackUser.lastName ||
              (fallbackUser.name?.split(' ')?.slice(1).join(' ') || ''),
            role: 'MEMBER',
            churchId: fallbackUser.churchId || null,
            phone: null,
            branchId: null,
            profileImage: null,
            bio: null,
            dateOfBirth: null,
            address: null,
            city: null,
            state: null,
            zipCode: null,
            country: null,
            password: undefined
          }
        : null)

    if (!baseUser) {
      return null
    }

    const linkedChurchId = baseUser.churchId
      ? await ensureChurchRecord(baseUser.churchId)
      : null

    const normalizedEmail =
      baseUser.email?.trim().toLowerCase() || `${baseUser.id}@ecclesia.local`

    const hashedPassword =
      baseUser.password && baseUser.password.startsWith?.('$2')
        ? baseUser.password
        : await bcrypt.hash(baseUser.password || normalizedEmail, 10)

    const created = await prisma.user.create({
      data: {
        id: baseUser.id,
        email: normalizedEmail,
        password: hashedPassword,
        firstName: baseUser.firstName || 'Member',
        lastName: baseUser.lastName || '',
        role: (baseUser.role?.toUpperCase() as any) || 'MEMBER',
        phone: baseUser.phone || null,
        churchId: linkedChurchId,
        branchId: baseUser.branchId || null,
        profileImage: baseUser.profileImage || null,
        bio: baseUser.bio || null,
        dateOfBirth: baseUser.dateOfBirth
          ? new Date(baseUser.dateOfBirth)
          : null,
        address: baseUser.address || null,
        city: baseUser.city || null,
        state: baseUser.state || null,
        zipCode: baseUser.zipCode || null,
        country: baseUser.country || null
      }
    })

    return created.id
  } catch (error) {
    console.error('Failed to ensure user record:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryChurchId = searchParams.get('churchId')

    const sessionUser = session.user as { id?: string; churchId?: string | null }
    const sessionUserId = sessionUser?.id || null

    const ensuredUserId = await ensureUserRecord(sessionUserId, sessionUser)

    if (!ensuredUserId) {
      return NextResponse.json(
        { error: 'Unable to load surveys for this user.' },
        { status: 404 }
      )
    }

    const resolvedChurchId = await resolveChurchId(
      queryChurchId,
      ensuredUserId,
      sessionUser?.churchId || null
    )

    if (!resolvedChurchId) {
      return NextResponse.json(
        { error: 'No church selected. Please select a church to view surveys.' },
        { status: 400 }
      )
    }

    const surveys = await SurveyService.getSurveysForUser(ensuredUserId, resolvedChurchId)

    return NextResponse.json({ surveys })
  } catch (error) {
    console.error('Error fetching surveys:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch surveys',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { churchId, intent = 'draft', ...surveyData } = data

    const sessionUser = session.user as { id?: string; churchId?: string | null }
    const sessionUserId = sessionUser?.id || ''

    const ensuredUserId = await ensureUserRecord(sessionUserId, sessionUser)

    if (!ensuredUserId) {
      return NextResponse.json(
        { error: 'Unable to identify the current user. Please re-authenticate.' },
        { status: 404 }
      )
    }

    const resolvedChurchId = await resolveChurchId(
      churchId,
      ensuredUserId,
      sessionUser?.churchId || null
    )

    if (!resolvedChurchId) {
      return NextResponse.json(
        { error: 'No church selected. Please select a church before creating surveys.' },
        { status: 400 }
      )
    }

    const survey = await SurveyService.createSurvey(
      resolvedChurchId,
      ensuredUserId,
      surveyData,
      intent
    )

    return NextResponse.json({ survey }, { status: 201 })
  } catch (error) {
    console.error('Error creating survey:', error)
    return NextResponse.json(
      {
        error: 'Failed to create survey',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}