import { DEFAULT_BIBLE_VERSION } from '@/lib/bible/config'
import { getDailyVerseEntry } from '@/lib/bible/daily-verses'
import { BibleService } from '@/lib/services/bible-service'
import { ReadingPlanDayService, ReadingPlanResourceService } from '@/lib/services/reading-plan-day-service'
import { ReadingPlanProgressService, ReadingPlanService } from '@/lib/services/reading-plan-service'
import { UserService } from '@/lib/services/user-service'
import { ReadingCoachContextPayload } from '@/lib/ai/openai'

function stripHtml(html?: string | null) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function truncate(text: string, length: number = 400) {
  if (!text) return ''
  if (text.length <= length) return text
  return `${text.slice(0, length)}…`
}

export interface ReadingCoachContextResult {
  context: ReadingCoachContextPayload
  plan?: {
    id: string
    title: string
    duration: number
    topics?: string[]
  } | null
  progress?: {
    id: string
    currentDay: number
    completed: boolean
    percentComplete?: number
  } | null
  day?: {
    dayNumber: number
    title?: string
    summary?: string
    prayerFocus?: string
  } | null
  dayResources?: Array<{
    id: string
    title: string
    type?: string
    description?: string
  }>
  dailyVerse?: {
    reference: string
    theme: string
    excerpt?: string
  }
}

export async function buildReadingCoachContext(options: {
  userId: string
  planId?: string
  dayNumber?: number
}): Promise<ReadingCoachContextResult> {
  const { userId, planId } = options
  const user = await UserService.findById(userId)

  const dailyVerseEntry = getDailyVerseEntry()
  let dailyVerseExcerpt: string | undefined
  try {
    const dailyPassage = await BibleService.getPassage(DEFAULT_BIBLE_VERSION.id, dailyVerseEntry.passageId)
    dailyVerseExcerpt = truncate(stripHtml(dailyPassage.content))
  } catch (error) {
    console.warn('Failed to fetch daily verse:', error)
  }

  let plan: ReadingCoachContextResult['plan'] = null
  let progress: ReadingCoachContextResult['progress'] = null
  let day: ReadingCoachContextResult['day'] = null
  let dayResources: ReadingCoachContextResult['dayResources'] = []
  let passageExcerpt: string | undefined
  let passageReference: string | undefined

  if (planId) {
    const planRecord = await ReadingPlanService.findById(planId)
    if (planRecord) {
      plan = {
        id: planRecord.id,
        title: planRecord.title,
        duration: planRecord.duration,
        topics: (planRecord as any)?.topics || [],
      }
      const progressRecord = await ReadingPlanProgressService.findByUserAndPlan(userId, planId)
      if (progressRecord) {
        const percentComplete = Math.min(
          100,
          Math.round((progressRecord.currentDay / planRecord.duration) * 100)
        )
        progress = {
          id: progressRecord.id,
          currentDay: progressRecord.currentDay,
          completed: progressRecord.completed,
          percentComplete,
        }
      }

      const resolvedDayNumber = options.dayNumber || progress?.currentDay || 1
      const dayRecord = await ReadingPlanDayService.findByPlanAndDay(planId, resolvedDayNumber)
      if (dayRecord) {
        day = {
          dayNumber: dayRecord.dayNumber,
          title: dayRecord.title,
          summary: dayRecord.summary,
          prayerFocus: dayRecord.prayerFocus,
        }

        if (dayRecord.resourceIds?.length) {
          const resources = await ReadingPlanResourceService.findMany(dayRecord.resourceIds)
          dayResources = resources.map((resource) => ({
            id: resource.id,
            title: resource.title,
            type: resource.type,
            description: resource.description,
          }))
        }

        try {
          const passage = await BibleService.getPassage(dayRecord.bibleVersionId, dayRecord.passageId)
          passageReference = passage.reference
          passageExcerpt = truncate(stripHtml(passage.content))
        } catch (error) {
          console.warn('Failed to fetch passage for reading coach context:', error)
        }
      }
    }
  }

  const context: ReadingCoachContextPayload = {
    user: user
      ? {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          spiritualMaturity: (user as any)?.spiritualMaturity,
          churchContext: (user as any)?.churchId,
        }
      : undefined,
    plan: plan
      ? {
          title: plan.title,
          duration: plan.duration,
          topics: plan.topics,
        }
      : null,
    progress: progress
      ? {
          currentDay: progress.currentDay,
          totalDays: plan?.duration,
          percentComplete: progress.percentComplete,
          completed: progress.completed,
        }
      : null,
    day: day
      ? {
          dayNumber: day.dayNumber,
          title: day.title,
          summary: day.summary,
          prayerFocus: day.prayerFocus,
        }
      : null,
    passage: passageExcerpt
      ? {
          reference: passageReference,
          excerpt: passageExcerpt,
        }
      : undefined,
    resources: dayResources?.length
      ? dayResources.map((resource) => ({
          title: resource.title,
          type: resource.type,
          description: resource.description,
        }))
      : undefined,
    dailyVerse: {
      reference: dailyVerseEntry.reference,
      theme: dailyVerseEntry.theme,
      excerpt: dailyVerseExcerpt,
    },
  }

  return {
    context,
    plan,
    progress,
    day,
    dayResources,
    dailyVerse: {
      reference: dailyVerseEntry.reference,
      theme: dailyVerseEntry.theme,
      excerpt: dailyVerseExcerpt,
    },
  }
}
