import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsService } from '@/lib/services/analytics-service'
import { formatChartDataByInterval, ChartDataPoint } from '@/lib/types/chart-types'

/**
 * GET /api/analytics/chart-data
 * Returns chart-formatted analytics data for specified metrics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const metric = searchParams.get('metric') || 'meetings'
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date()
    const church = searchParams.get('church') || 'default-church'
    const interval = (searchParams.get('interval') || 'daily') as 'daily' | 'weekly' | 'monthly'

    let rawData: ChartDataPoint[] = []

    try {
      switch (metric) {
        case 'meetings': {
          const meetingData = await AnalyticsService.getChurchMeetingAnalytics(church, startDate, endDate)
          rawData = (meetingData || []).map((item: any, index: number) => ({
            time: item.scheduledDate?.toDate?.() || item.scheduledDate || new Date(),
            value: item.attendeeCount || item.count || 0,
            label: new Date(item.scheduledDate?.toDate?.() || item.scheduledDate || new Date()).toLocaleDateString() || `Day ${index + 1}`,
            metadata: {
              date: item.scheduledDate,
              duration: item.duration,
              title: item.title,
            },
          }))
          break
        }

        case 'attendance': {
          const attendanceData = await AnalyticsService.getAttendanceAnalytics(church, startDate, endDate)
          rawData = (attendanceData || []).map((item: any, index: number) => ({
            time: item.eventDate?.toDate?.() || item.eventDate || new Date(),
            value: item.attendeesPresent || item.present || 0,
            label: new Date(item.eventDate?.toDate?.() || item.eventDate || new Date()).toLocaleDateString() || `Day ${index + 1}`,
            metadata: {
              date: item.eventDate,
              totalExpected: item.totalExpected,
              absent: item.totalExpected ? item.totalExpected - (item.attendeesPresent || 0) : 0,
            },
          }))
          break
        }

        case 'livestream': {
          // Placeholder for livestream analytics
          // When integrated with livestream service, replace this with actual data
          rawData = []
          break
        }

        case 'engagement': {
          // Engagement data would come from engagement analytics
          // Placeholder for now
          rawData = []
          break
        }

        default: {
          // Default: return empty array
          rawData = []
        }
      }
    } catch (analyticError) {
      console.warn(`Warning fetching ${metric} analytics:`, analyticError)
      // Continue with empty data rather than failing
      rawData = []
    }

    // Format data by interval
    const formattedData = formatChartDataByInterval(rawData, interval)

    return NextResponse.json(
      {
        success: true,
        metric,
        startDate,
        endDate,
        interval,
        dataPoints: rawData.length,
        data: rawData,
        formatted: formattedData,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Chart data API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch chart data',
      },
      { status: 500 }
    )
  }
}

