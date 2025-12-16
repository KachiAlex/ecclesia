import { NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user-service'
import { PasswordResetService } from '@/lib/services/password-reset-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await UserService.findByEmail(email)

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      })
    }

    // Generate reset token
    const resetToken = await PasswordResetService.createToken(user.id)

    // Generate reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken.token}`

    // Send email with reset link
    const { EmailService } = await import('@/lib/services/email-service')
    const emailResult = await EmailService.sendPasswordResetEmail(
      user.email,
      resetUrl,
      `${user.firstName} ${user.lastName}`
    )

    // Log in development if email fails
    if (!emailResult.success && process.env.NODE_ENV === 'development') {
      console.log('Password reset link for', user.email, ':', resetUrl)
      console.warn('Email service not configured. Reset link logged above.')
    }

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
      // Remove this in production - only for development
      ...(process.env.NODE_ENV === 'development' && { resetUrl }),
    })
  } catch (error: any) {
    console.error('Error processing forgot password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

