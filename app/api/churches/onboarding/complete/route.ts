import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurchId } from '@/lib/church-context'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const churchId = await getCurrentChurchId(userId)

    if (!churchId) {
      return NextResponse.json(
        { error: 'Church not found' },
        { status: 404 }
      )
    }

    // Mark onboarding as complete by setting a flag in the church document
    // We can use the presence of address or description as the indicator
    // This is already handled in the layout check

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding complete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

