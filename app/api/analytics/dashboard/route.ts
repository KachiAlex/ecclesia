export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { guardApi } from '@/lib/api-guard'
import { AnalyticsService } from '@/lib/services/analytics-service'
import { subDays } from 'date-fns'

export async function GET(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true })
    if (!guarded.ok) return guarded.response

    const { church } = guarded.ctx
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') as 'week' | 'month' | 'year') || 'month'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Parse dates or use default range
    let start: Date
    let end: Date

    if (startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
    } else {
      end = new Date()
      start = subDays(end, period === 'week' ? 7 : period === 'month' ? 30 : 365)
    }

    // Fetch all analytics in parallel
    const [meetingData, livestreamData, attendanceData] = await Promise.all([
      AnalyticsService.getChurchMeetingAnalytics(church.id, start, end).catch(() => []),
      AnalyticsService.getChurchLivestreamAnalytics(church.id, start, end).catch(() => []),
      AnalyticsService.getAttendanceAnalytics(church.id, start, end).catch(() => []),
    ])

    // Calculate meeting metrics
    const meetingMetrics = {
      totalMeetings: meetingData?.length || 0,
      avgAttendance:
        meetingData?.length > 0
          ? meetingData.reduce((sum: number, m: any) => sum + (m.totalAttendees || 0), 0) / meetingData.length
          : 0,
      avgEngagement:
        meetingData?.length > 0
          ? meetingData.reduce((sum: number, m: any) => sum + (m.engagementScore || 0), 0) / meetingData.length
          : 0,
      totalAttendees: meetingData?.reduce((sum: number, m: any) => sum + (m.totalAttendees || 0), 0) || 0,
      peakAttendees: Math.max(...(meetingData?.map((m: any) => m.peakAttendees || 0) || [0])),
      avgDuration:
        meetingData?.length > 0
          ? meetingData.reduce((sum: number, m: any) => sum + (m.averageSessionDuration || 0), 0) / meetingData.length
          : 0,
    }

    // Calculate livestream metrics
    const livestreamMetrics = {
      totalLivestreams: livestreamData?.length || 0,
      totalViewers: livestreamData?.reduce((sum: number, l: any) => sum + (l.totalViewers || 0), 0) || 0,
      avgViewers:
        livestreamData?.length > 0
          ? livestreamData.reduce((sum: number, l: any) => sum + (l.totalViewers || 0), 0) / livestreamData.length
          : 0,
      peakViewers: Math.max(...(livestreamData?.map((l: any) => l.peakViewers || 0) || [0])),
      avgRetention:
        livestreamData?.length > 0
          ? livestreamData.reduce((sum: number, l: any) => sum + (l.completionRate || 0), 0) / livestreamData.length
          : 0,
      totalEngagement:
        livestreamData?.reduce(
          (sum: number, l: any) =>
            sum +
            ((l.engagementMetrics?.comments || 0) +
              (l.engagementMetrics?.reactions || 0) +
              (l.engagementMetrics?.shares || 0)),
          0
        ) || 0,
    }

    // Calculate attendance metrics
    const attendanceMetrics = {
      totalEvents: attendanceData?.length || 0,
      avgAttendanceRate:
        attendanceData?.length > 0
          ? attendanceData.reduce((sum: number, a: any) => sum + (a.attendanceRate || 0), 0) / attendanceData.length
          : 0,
      totalAttended: attendanceData?.reduce((sum: number, a: any) => sum + (a.totalPresent || 0), 0) || 0,
      totalExpected: attendanceData?.reduce((sum: number, a: any) => sum + (a.totalExpected || 0), 0) || 0,
      totalLate: attendanceData?.reduce((sum: number, a: any) => sum + (a.lateCount || 0), 0) || 0,
    }

    // Calculate growth metrics
    const midpoint = new Date((start.getTime() + end.getTime()) / 2)
    const firstHalf = {
      meetings: meetingData?.filter((m: any) => new Date(m.startedAt) < midpoint) || [],
      attendance: attendanceData?.filter((a: any) => new Date(a.date) < midpoint) || [],
    }
    const secondHalf = {
      meetings: meetingData?.filter((m: any) => new Date(m.startedAt) >= midpoint) || [],
      attendance: attendanceData?.filter((a: any) => new Date(a.date) >= midpoint) || [],
    }

    const firstHalfAvg = firstHalf.meetings.reduce((sum: number, m: any) => sum + (m.engagementScore || 0), 0) / Math.max(1, firstHalf.meetings.length)
    const secondHalfAvg = secondHalf.meetings.reduce((sum: number, m: any) => sum + (m.engagementScore || 0), 0) / Math.max(1, secondHalf.meetings.length)

    return NextResponse.json({
      success: true,
      period: { start, end },
      summaries: {
        meeting: meetingMetrics,
        livestream: livestreamMetrics,
        attendance: attendanceMetrics,
        growth: {
          engagementGrowth: ((secondHalfAvg - firstHalfAvg) / Math.max(1, firstHalfAvg)) * 100 || 0,
          attendanceGrowth:
            ((secondHalf.attendance.length - firstHalf.attendance.length) / Math.max(1, firstHalf.attendance.length)) * 100 || 0,
        },
      },
      rawData: {
        meetings: meetingData,
        livestreams: livestreamData,
        attendance: attendanceData,
      },
    })
  } catch (error: any) {
    console.error('Error fetching analytics dashboard:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics dashboard' },
      { status: 500 }
    )
  }
}
