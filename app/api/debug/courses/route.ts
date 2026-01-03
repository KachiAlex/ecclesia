import { NextResponse } from 'next/server'
import { DigitalCourseService } from '@/lib/services/digital-school-service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const churchId = searchParams.get('churchId')
    
    if (!churchId) {
      return NextResponse.json({ error: 'churchId parameter required' }, { status: 400 })
    }
    
    const courses = await DigitalCourseService.list(churchId)
    
    return NextResponse.json({
      success: true,
      count: courses.length,
      courses: courses.map(course => ({
        id: course.id,
        title: course.title,
        summary: course.summary,
        status: course.status,
        accessType: course.accessType,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      }))
    })
  } catch (error: any) {
    console.error('Debug courses error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch courses',
      success: false 
    }, { status: 500 })
  }
}