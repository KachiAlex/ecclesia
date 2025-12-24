
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { guardApi } from '@/lib/api-guard'
import { UserService } from '@/lib/services/user-service'
import { AccountingIncomeService } from '@/lib/services/accounting-income-service'
import { StorageService } from '@/lib/services/storage-service'

export async function POST(request: Request) {
  try {
    const guarded = await guardApi({ requireChurch: true, allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'BRANCH_ADMIN', 'PASTOR'] })
    if (!guarded.ok) return guarded.response

    const { church, userId, role } = guarded.ctx
    const user = await UserService.findById(userId)

    const formData = await request.formData()

    const branchId = (formData.get('branchId') as string | null) || null
    const amountRaw = formData.get('amount') as string | null
    const currency = (formData.get('currency') as string | null) || null
    const source = (formData.get('source') as string | null) || 'Other'
    const description = (formData.get('description') as string | null) || null
    const incomeDateRaw = formData.get('incomeDate') as string | null
    const file = formData.get('file') as File | null

    const amount = amountRaw ? Number(amountRaw) : 0

    if (!amount || !incomeDateRaw) {
      return NextResponse.json({ error: 'amount and incomeDate are required' }, { status: 400 })
    }

    const effectiveBranchId = role === 'BRANCH_ADMIN' ? ((user as any)?.branchId || null) : (branchId || null)
    if (role !== 'BRANCH_ADMIN' && !effectiveBranchId) {
      return NextResponse.json({ error: 'branchId is required' }, { status: 400 })
    }
    if (role === 'BRANCH_ADMIN' && branchId && branchId !== effectiveBranchId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let attachmentUrl: string | undefined
    let attachmentPath: string | undefined

    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: `Invalid receipt type: ${file.type}` }, { status: 400 })
      }

      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        return NextResponse.json({ error: 'Receipt file too large (max 10MB)' }, { status: 400 })
      }

      const uploaded = await StorageService.uploadFile({
        file,
        fileName: file.name || `receipt-${Date.now()}`,
        folder: `accounting/${church.id}/income-receipts`,
        userId,
        churchId: church.id,
        contentType: file.type,
      })

      attachmentUrl = uploaded.url
      attachmentPath = uploaded.path
    }

    const created = await AccountingIncomeService.create({
      churchId: church.id,
      branchId: effectiveBranchId || undefined,
      amount,
      currency: currency || undefined,
      source,
      description: description || undefined,
      incomeDate: new Date(incomeDateRaw),
      attachmentUrl,
      attachmentPath,
      createdBy: userId,
    })

    return NextResponse.json({ income: created }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
