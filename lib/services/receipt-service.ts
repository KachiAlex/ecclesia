import PDFDocument from 'pdfkit'
import { StorageService } from '@/lib/services/storage-service'
import { GivingService } from '@/lib/services/giving-service'

export type DonationReceiptInput = {
  givingId: string
  userId: string
  userName?: string
  userEmail?: string
  amount: number
  currency?: string
  type: string
  projectName?: string
  transactionId?: string
  date: Date
  churchName?: string
}

export class ReceiptService {
  static async generateDonationReceiptPdf(input: DonationReceiptInput): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })

    const chunks: Buffer[] = []
    doc.on('data', (c: any) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))

    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
    })

    doc.fontSize(20).text(input.churchName || 'Ecclesia', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(14).text('Donation Receipt', { align: 'center' })

    doc.moveDown(1.5)
    doc.fontSize(11)

    const line = (label: string, value: string) => {
      doc.text(label, { continued: true })
      doc.font('Helvetica-Bold').text(value)
      doc.font('Helvetica')
    }

    line('Receipt ID: ', input.givingId)
    if (input.transactionId) line('Transaction ID: ', input.transactionId)
    line('Date: ', input.date.toLocaleString())
    if (input.userName) line('Donor: ', input.userName)
    if (input.userEmail) line('Email: ', input.userEmail)
    if (input.projectName) line('Project: ', input.projectName)
    line('Type: ', input.type)

    doc.moveDown(0.5)
    doc.fontSize(14).font('Helvetica-Bold')
    const currency = input.currency || 'USD'
    doc.text(`Amount: ${currency} ${input.amount.toFixed(2)}`)
    doc.font('Helvetica')

    doc.moveDown(2)
    doc.fontSize(10)
    doc.text(
      'This receipt acknowledges your donation. Thank you for your generosity.',
      { align: 'left' }
    )

    doc.end()

    return done
  }

  static async generateUploadAndAttachDonationReceipt(input: DonationReceiptInput): Promise<string> {
    const pdfBuffer = await this.generateDonationReceiptPdf(input)

    const fileName = `donation-receipt-${input.givingId}.pdf`
    const upload = await StorageService.uploadFile({
      file: pdfBuffer,
      fileName,
      folder: 'receipts',
      userId: input.userId,
      contentType: 'application/pdf',
    })

    await GivingService.update(input.givingId, { receiptUrl: upload.url })

    return upload.url
  }
}
