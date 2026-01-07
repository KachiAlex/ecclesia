import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { SurveyService } from '@/lib/services/survey-service'
import { prisma } from '@/lib/prisma'
import { getCurrentChurchId } from '@/lib/church-context'
import { ChurchService, generateSlug } from '@/lib/services/church-service'

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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryChurchId = searchParams.get('churchId')

    const sessionUser = session.user as { id?: string }
    const sessionUserId = sessionUser?.id

    const resolvedChurchId = await resolveChurchId(queryChurchId, sessionUserId)

    if (!resolvedChurchId) {
      return NextResponse.json(
        { error: 'No church selected. Please select a church to view surveys.' },
        { status: 400 }
      )
    }

    const surveys = await SurveyService.getSurveysForUser(
      session.user.id,
      resolvedChurchId
    )

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

    const sessionUser = session.user as { id?: string }
    const sessionUserId = sessionUser?.id

    const resolvedChurchId = await resolveChurchId(churchId, sessionUserId)

    if (!resolvedChurchId) {
      return NextResponse.json(
        { error: 'No church selected. Please select a church before creating surveys.' },
        { status: 400 }
      )
    }

    const survey = await SurveyService.createSurvey(
      resolvedChurchId,
      session.user.id,
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