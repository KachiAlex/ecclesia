import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { UserService } from '@/lib/services/user-service'
import { ChurchService } from '@/lib/services/church-service'
import { generateQRCode } from '@/lib/qr-code'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const user = await UserService.findById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get church info
    const church = user.churchId ? await ChurchService.findById(user.churchId) : null

    // Generate or retrieve membership QR code
    // In production, this would be stored in user profile
    const membershipQR = generateQRCode(`MEMBER-${church?.id || 'CHURCH'}`)

    return NextResponse.json({
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
      church: church ? {
        id: church.id,
        name: church.name,
        logo: church.logo,
      } : null,
      qrCode: membershipQR,
      memberSince: church ? user.createdAt.toISOString() : null,
    })
  } catch (error) {
    console.error('Error generating membership card:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

