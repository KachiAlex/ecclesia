import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { AIAssistantService } from '@/lib/services/ai-assistant-service'
import { prisma } from '@/lib/prisma'
import { getCurrentChurchId } from '@/lib/church-context'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, type } = body

    if (!userId || !type) {
      return NextResponse.json({ error: 'Missing userId or type' }, { status: 400 })
    }

    const adminUserId = (session.user as any).id
    const churchId = await getCurrentChurchId(adminUserId)

    if (!churchId) {
      return NextResponse.json({ error: 'No church found' }, { status: 404 })
    }

    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: { name: true },
    })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        dateOfBirth: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let message: string

    if (type === 'birthday') {
      const ageTurning = user.dateOfBirth
        ? new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()
        : 0

      message = await AIAssistantService.generateBirthdayMessage(
        user.firstName,
        user.lastName,
        ageTurning,
        church?.name || 'our church'
      )
    } else {
      message = `Hello ${user.firstName}, we're thinking of you today!`
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error generating message:', error)
    return NextResponse.json({ error: 'Failed to generate message' }, { status: 500 })
  }
}
