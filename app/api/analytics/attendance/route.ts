import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { AnalyticsService } from '@/lib/services/analytics-service'
import { AttendanceAnalytics } from '@/lib/types/analytics'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { churchId, ...attendanceData } = body

    if (!churchId) {
      return NextResponse.json({ error: 'Church ID required' }, { status: 400 })
    }

    const attendanceId = await AnalyticsService.recordAttendance(
      churchId,
      attendanceData as Omit<AttendanceAnalytics, 'attendanceId'>
    )
    return NextResponse.json({ success: true, attendanceId })
  } catch (error) {
    console.error('Attendance analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const churchId = searchParams.get('churchId')
    const startDate = new Date(searchParams.get('startDate') || '')
    const endDate = new Date(searchParams.get('endDate') || '')

    if (!churchId) {
      return NextResponse.json({ error: 'Church ID required' }, { status: 400 })
    }

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
    }

    const attendance = await AnalyticsService.getAttendanceAnalytics(churchId, startDate, endDate)
    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Get attendance analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
