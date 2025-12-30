import PDFDocument from 'pdfkit'
import { StorageService } from '@/lib/services/storage-service'
import {
  CertificateTheme,
  DigitalCourseEnrollmentService,
} from '@/lib/services/digital-school-service'

type CertificatePdfInput = {
  studentName: string
  courseTitle: string
  issuedDate: Date
  churchName?: string
  theme?: CertificateTheme | null
}

type CertificateUploadInput = {
  enrollmentId: string
  courseId: string
  userId: string
  studentName: string
  courseTitle: string
  churchName?: string
  theme?: CertificateTheme | null
  badgeIssuedAt?: Date
}

const DEFAULT_THEME: Required<CertificateTheme> = {
  template: 'classic',
  accentColor: '#4338ca',
  secondaryColor: '#1e293b',
  backgroundImageUrl: '',
  logoUrl: '',
  signatureText: 'Lead Pastor',
  sealText: 'Ecclesia Training Institute',
  issuedBy: 'Ecclesia',
}

// Simple certificate generation using only built-in fonts
const generateCertificatePdf = (input: CertificatePdfInput): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const theme = { ...DEFAULT_THEME, ...(input.theme || {}) }
      const doc = new PDFDocument({
        size: 'A4',
        margin: 60,
        fontLayoutCache: false,
      })

      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const pageWidth = doc.page.width
      const pageHeight = doc.page.height

      // Background
      doc.save()
      doc.rect(0, 0, pageWidth, pageHeight).fill('#fdfaf7')
      doc.restore()

      // Accent border
      doc
        .save()
        .lineWidth(6)
        .strokeColor(theme.accentColor)
        .rect(20, 20, pageWidth - 40, pageHeight - 40)
        .stroke()
        .restore()

      // Header with seal text
      doc.font('Helvetica-Bold')
      doc
        .fontSize(28)
        .fillColor(theme.secondaryColor)
        .text(theme.sealText || DEFAULT_THEME.sealText, { align: 'center', lineGap: 6 })

      doc
        .fontSize(18)
        .fillColor(theme.accentColor)
        .text('Certificate of Completion', { align: 'center', lineGap: 10 })

      doc.moveDown(2)

      // Certificate body
      doc.font('Helvetica')
      doc
        .fontSize(12)
        .fillColor(theme.secondaryColor)
        .text('This certifies that', { align: 'center' })

      doc
        .moveDown(0.5)
        .font('Helvetica-Bold')
        .fontSize(24)
        .text(input.studentName, { align: 'center' })

      doc
        .moveDown(0.5)
        .font('Helvetica')
        .fontSize(12)
        .text('has successfully completed', { align: 'center' })

      doc
        .moveDown(0.5)
        .font('Helvetica-Bold')
        .fontSize(18)
        .text(input.courseTitle, { align: 'center' })

      doc
        .moveDown(1.5)
        .font('Helvetica')
        .fontSize(11)
        .text(
          `Awarded on ${input.issuedDate.toLocaleDateString()} by ${theme.issuedBy || input.churchName || 'Ecclesia'}.`,
          { align: 'center' },
        )

      // Signature area
      doc.moveDown(3)
      const signatureY = doc.y
      doc
        .moveTo(pageWidth / 2 - 120, signatureY)
        .lineTo(pageWidth / 2 + 120, signatureY)
        .strokeColor(theme.secondaryColor)
        .lineWidth(1)
        .stroke()

      doc
        .fontSize(12)
        .text(theme.signatureText || DEFAULT_THEME.signatureText, pageWidth / 2 - 120, signatureY + 10, {
          width: 240,
          align: 'center',
        })

      doc
        .fontSize(10)
        .text(theme.issuedBy || input.churchName || DEFAULT_THEME.issuedBy, pageWidth / 2 - 120, doc.y + 5, {
          width: 240,
          align: 'center',
        })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

export class CertificateService {
  static async generateCertificatePdf(input: CertificatePdfInput): Promise<Buffer> {
    console.log('Generating certificate PDF for:', input.studentName)
    try {
      return await generateCertificatePdf(input)
    } catch (error) {
      console.error('Certificate PDF generation failed:', error)
      throw new Error(`Certificate generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async generateUploadAndAttachCertificate(input: CertificateUploadInput): Promise<{ url: string; path: string }> {
    try {
      console.log('Starting certificate generation for:', input.enrollmentId)
      
      const pdfBuffer = await this.generateCertificatePdf({
        studentName: input.studentName,
        courseTitle: input.courseTitle,
        issuedDate: new Date(),
        churchName: input.churchName,
        theme: input.theme,
      })

      console.log('PDF generated successfully, size:', pdfBuffer.length)

      const fileName = `certificate-${input.courseId}-${input.userId}-${Date.now()}.pdf`
      const upload = await StorageService.uploadFile({
        file: pdfBuffer,
        fileName,
        folder: `digital-school/certificates/${input.courseId}`,
        userId: input.userId,
        contentType: 'application/pdf',
      })

      console.log('Certificate uploaded successfully:', upload.url)

      await DigitalCourseEnrollmentService.updateProgress(
        input.enrollmentId,
        undefined,
        undefined,
        undefined,
        input.badgeIssuedAt ?? new Date(),
        {
          url: upload.url,
          storagePath: upload.path,
          issuedAt: new Date(),
        },
      )

      console.log('Enrollment updated with certificate URL')
      return upload
    } catch (error) {
      console.error('Certificate generation failed:', error)
      throw new Error(`Certificate generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
