import { NextResponse } from 'next/server'
import { ChurchService } from '@/lib/services/church-service'
import { guardApi } from '@/lib/api-guard'

export async function GET() {
  try {
    const guarded = await guardApi({ allowedRoles: ['SUPER_ADMIN'] })
    if (!guarded.ok) return guarded.response

    const churches = await ChurchService.findAll()

    return NextResponse.json(churches)
  } catch (error) {
    console.error('Error fetching churches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

