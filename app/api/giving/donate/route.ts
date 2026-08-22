
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import { GivingService } from '@/lib/services/giving-service'
import { ProjectService } from '@/lib/services/giving-service'
import { UserService } from '@/lib/services/user-service'
import { ReceiptService } from '@/lib/services/receipt-service'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const church = await getCurrentChurch(userId)

    if (!church) {
      return NextResponse.json(
        { error: 'No church selected' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      amount,
      currency,
      type,
      projectId,
      paymentMethod,
      transactionId,
      notes,
    } = body

    if (!amount || !type) {
      return NextResponse.json(
        { error: 'Amount and type are required' },
        { status: 400 }
      )
    }

    // Verify project if provided
    let project = null
    if (projectId) {
      project = await ProjectService.findById(projectId)
      if (!project || project.churchId !== church.id || project.status !== 'Active') {
        return NextResponse.json(
          { error: 'Project not found or inactive' },
          { status: 404 }
        )
      }
    }

    // Create giving record (ProjectService.incrementAmount is called automatically)
    const user = await UserService.findById(userId)
    const giving = await GivingService.create({
      userId,
      churchId: church.id,
      branchId: (user as any)?.branchId || undefined,
      amount: parseFloat(amount),
      currency: currency || project?.currency || undefined,
      type,
      projectId: projectId || undefined,
      paymentMethod: paymentMethod || undefined,
      transactionId: transactionId || undefined,
      notes: notes || undefined,
    })

    // Get user and project data

    let receiptUrl: string | undefined
    try {
      receiptUrl = await ReceiptService.generateUploadAndAttachDonationReceipt({
        givingId: giving.id,
        userId,
        userName: user ? `${user.firstName} ${user.lastName}` : undefined,
        userEmail: user?.email,
        amount: parseFloat(amount),
        type,
        projectName: project?.name,
        transactionId: transactionId || giving.id,
        date: new Date(giving.createdAt),
        churchName: church?.name,
      })
    } catch (error) {
      console.error('Error generating donation receipt:', error)
    }

    // Send donation receipt email
    if (user) {
      const { EmailService } = await import('@/lib/services/email-service')
      await EmailService.sendDonationReceipt(
        user.email,
        {
          amount: parseFloat(amount),
          type,
          projectName: project?.name,
          transactionId: transactionId || giving.id,
          date: new Date(giving.createdAt),
          receiptUrl,
        },
        `${user.firstName} ${user.lastName}`
      )
    }

    return NextResponse.json(
      {
        ...giving,
        project: project ? {
          id: project.id,
          name: project.name,
        } : null,
        user: user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        } : null,
        receiptUrl: receiptUrl || null,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error processing donation:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
