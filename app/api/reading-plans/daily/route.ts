import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { getDailyVerseEntry } from '@/lib/bible/daily-verses'
import { BibleService, getBibleVersionById } from '@/lib/services/bible-service'

export async function GET(request: Request) {
  try {
    const guard = await guardApi()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const bibleIdParam = searchParams.get('bibleId') || undefined

    const targetDate = dateParam ? new Date(dateParam) : new Date()
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date parameter.' }, { status: 400 })
    }

    const entry = getDailyVerseEntry(targetDate)
    const bibleVersion = getBibleVersionById(bibleIdParam)
    const passage = await BibleService.getPassage(bibleVersion.id, entry.passageId)

    return NextResponse.json({
      date: targetDate.toISOString(),
      entry,
      bibleVersion,
      passage,
    })
  } catch (error: any) {
    console.error('Error fetching daily reading:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch daily reading' }, { status: 500 })
  }
}
