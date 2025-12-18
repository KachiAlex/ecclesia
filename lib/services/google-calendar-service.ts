import crypto from 'crypto'
import { calendar_v3 } from 'googleapis'
import { MeetingRecurrence } from '@/lib/services/meeting-service'

function weekdayToRRule(wd: number): string | null {
  // 0-6 => SU..SA
  const map = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
  if (wd < 0 || wd > 6) return null
  return map[wd]
}

export function buildRRule(recurrence: MeetingRecurrence): string | null {
  const interval = Math.max(1, Math.floor(recurrence.interval || 1))

  const until = recurrence.until
    ? recurrence.until.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
    : null

  // CUSTOM: infer byMonthDay => monthly else weekly
  const freq =
    recurrence.frequency === 'CUSTOM'
      ? recurrence.byMonthDay
        ? 'MONTHLY'
        : 'WEEKLY'
      : recurrence.frequency

  const parts: string[] = [`FREQ=${freq}`, `INTERVAL=${interval}`]

  if (until) parts.push(`UNTIL=${until}`)

  if (freq === 'WEEKLY') {
    const by = (recurrence.byWeekday || []).map(weekdayToRRule).filter(Boolean) as string[]
    if (by.length) parts.push(`BYDAY=${by.join(',')}`)
  }

  if (freq === 'MONTHLY') {
    const md = recurrence.byMonthDay
    if (md && Number.isFinite(md)) parts.push(`BYMONTHDAY=${Math.max(1, Math.min(31, Math.floor(md)))}`)
  }

  return `RRULE:${parts.join(';')}`
}

export async function createCalendarEventWithMeet(params: {
  calendar: calendar_v3.Calendar
  calendarId: string
  title: string
  description?: string
  startAt: Date
  endAt?: Date
  timezone?: string
  recurrence?: MeetingRecurrence
}): Promise<{ eventId: string; meetUrl?: string }> {
  const durationMs = params.endAt ? params.endAt.getTime() - params.startAt.getTime() : 60 * 60 * 1000
  const endAt = params.endAt ? params.endAt : new Date(params.startAt.getTime() + Math.max(5 * 60 * 1000, durationMs))

  const rrule = params.recurrence ? buildRRule(params.recurrence) : null

  const requestId = crypto.randomBytes(16).toString('hex')

  const res = await params.calendar.events.insert({
    calendarId: params.calendarId,
    conferenceDataVersion: 1,
    requestBody: {
      summary: params.title,
      description: params.description,
      start: {
        dateTime: params.startAt.toISOString(),
        timeZone: params.timezone || undefined,
      },
      end: {
        dateTime: endAt.toISOString(),
        timeZone: params.timezone || undefined,
      },
      recurrence: rrule ? [rrule] : undefined,
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  })

  const event = res.data
  const meetUrl = (event.conferenceData as any)?.entryPoints?.find((e: any) => e?.entryPointType === 'video')?.uri

  return {
    eventId: String(event.id || ''),
    meetUrl: meetUrl ? String(meetUrl) : undefined,
  }
}

export async function updateCalendarEvent(params: {
  calendar: calendar_v3.Calendar
  calendarId: string
  eventId: string
  title: string
  description?: string
  startAt: Date
  endAt?: Date
  timezone?: string
  recurrence?: MeetingRecurrence
}): Promise<{ meetUrl?: string }> {
  const durationMs = params.endAt ? params.endAt.getTime() - params.startAt.getTime() : 60 * 60 * 1000
  const endAt = params.endAt ? params.endAt : new Date(params.startAt.getTime() + Math.max(5 * 60 * 1000, durationMs))

  const rrule = params.recurrence ? buildRRule(params.recurrence) : null

  const res = await params.calendar.events.patch({
    calendarId: params.calendarId,
    eventId: params.eventId,
    conferenceDataVersion: 1,
    sendUpdates: 'none',
    requestBody: {
      summary: params.title,
      description: params.description,
      start: {
        dateTime: params.startAt.toISOString(),
        timeZone: params.timezone || undefined,
      },
      end: {
        dateTime: endAt.toISOString(),
        timeZone: params.timezone || undefined,
      },
      // To clear recurrence in Google Calendar, set empty array.
      recurrence: rrule ? [rrule] : [],
    },
  })

  const event = res.data
  const meetUrl = (event.conferenceData as any)?.entryPoints?.find((e: any) => e?.entryPointType === 'video')?.uri

  return {
    meetUrl: meetUrl ? String(meetUrl) : undefined,
  }
}
