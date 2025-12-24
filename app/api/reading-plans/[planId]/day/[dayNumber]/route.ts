
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { ReadingPlanDayService, ReadingPlanResourceService } from '@/lib/services/reading-plan-day-service'
import { BibleService, getBibleVersionById } from '@/lib/services/bible-service'

type RouteParams = {
  planId: string
  dayNumber: string
}

function parseDayNumber(dayNumber: string) {
  const parsed = Number(dayNumber)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Invalid day number. Day number must be a positive integer.')
  }
  return parsed
}

export async function GET(
  request: Request,
  { params }: { params: RouteParams }
) {
  try {
    const guard = await guardApi()
    if (!guard.ok) return guard.response

    const planId = params.planId
    const dayNumber = parseDayNumber(params.dayNumber)

    const day = await ReadingPlanDayService.findByPlanAndDay(planId, dayNumber)
    if (!day) {
      return NextResponse.json({ error: 'Reading plan day not found' }, { status: 404 })
    }

    const bibleVersion = getBibleVersionById(day.bibleVersionId)
    const passage = await BibleService.getPassage(bibleVersion.id, day.passageId)
    const resources = day.resourceIds?.length
      ? await ReadingPlanResourceService.findMany(day.resourceIds)
      : []

    return NextResponse.json({
      ...day,
      bibleVersion,
      passage,
      resources,
    })
  } catch (error: any) {
    console.error('Error fetching reading plan day:', error)
    const message = error.message === 'Invalid day number. Day number must be a positive integer.'
      ? error.message
      : 'Failed to fetch reading plan day'
    const status = message === error.message ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: RouteParams }
) {
  try {
    const guard = await guardApi({
      allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PASTOR'],
    })
    if (!guard.ok) return guard.response

    const planId = params.planId
    const dayNumber = parseDayNumber(params.dayNumber)
    const body = await request.json()

    const {
      title,
      summary,
      passageId,
      bibleVersionId,
      devotionalText,
      prayerFocus,
      resourceIds,
    } = body

    if (!title || !passageId) {
      return NextResponse.json(
        { error: 'Title and passageId are required.' },
        { status: 400 }
      )
    }

    const version = getBibleVersionById(bibleVersionId)

    const updated = await ReadingPlanDayService.upsert({
      planId,
      dayNumber,
      title,
      summary,
      passageId,
      bibleVersionId: version.id,
      devotionalText,
      prayerFocus,
      resourceIds,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating reading plan day:', error)
    const message =
      error.message === 'Invalid day number. Day number must be a positive integer.'
        ? error.message
        : error.message || 'Failed to update reading plan day'
    const status = message === error.message && message.includes('Invalid day number') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
