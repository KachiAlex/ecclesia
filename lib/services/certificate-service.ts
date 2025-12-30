import { jsPDF } from 'jspdf'
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

// Convert hex color to RGB values for jsPDF
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [67, 56, 202] // Default blue
}

// Generate certificate using jsPDF (more reliable in serverless)
const generateCertificatePdf = (input: CertificatePdfInput): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const theme = { ...DEFAULT_THEME, ...(input.theme || {}) }
      
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      
      // Background color
      doc.setFillColor(253, 250, 247) // #fdfaf7
      doc.rect(0, 0, pageWidth, pageHeight, 'F')

      // Border
      const [accentR, accentG, accentB] = hexToRgb(theme.accentColor)
      doc.setDrawColor(accentR, accentG, accentB)
      doc.setLineWidth(2)
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20)

      // Colors
      const [secondaryR, secondaryG, secondaryB] = hexToRgb(theme.secondaryColor)

      // Header - Seal Text
      doc.setTextColor(secondaryR, secondaryG, secondaryB)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      const sealText = theme.sealText || DEFAULT_THEME.sealText
      doc.text(sealText, pageWidth / 2, 40, { align: 'center' })

      // Certificate Title
      doc.setTextColor(accentR, accentG, accentB)
      doc.setFontSize(18)
      doc.text('Certificate of Completion', pageWidth / 2, 55, { align: 'center' })

      // Certificate Body
      doc.setTextColor(secondaryR, secondaryG, secondaryB)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text('This certifies that', pageWidth / 2, 80, { align: 'center' })

      // Student Name
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.text(input.studentName, pageWidth / 2, 95, { align: 'center' })

      // Completion Text
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text('has successfully completed', pageWidth / 2, 110, { align: 'center' })

      // Course Title
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text(input.courseTitle, pageWidth / 2, 125, { align: 'center' })

      // Date and Issuer
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const dateText = `Awarded on ${input.issuedDate.toLocaleDateString()} by ${theme.issuedBy || input.churchName || 'Ecclesia'}.`
      doc.text(dateText, pageWidth / 2, 145, { align: 'center' })

      // Signature Line
      const signatureY = 170
      doc.setDrawColor(secondaryR, secondaryG, secondaryB)
      doc.setLineWidth(0.5)
      doc.line(pageWidth / 2 - 40, signatureY, pageWidth / 2 + 40, signatureY)

      // Signature Text
      doc.setFontSize(10)
      doc.text(theme.signatureText || DEFAULT_THEME.signatureText, pageWidth / 2, signatureY + 8, { align: 'center' })
      doc.text(theme.issuedBy || input.churchName || DEFAULT_THEME.issuedBy, pageWidth / 2, signatureY + 15, { align: 'center' })

      // Convert to buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      resolve(pdfBuffer)
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
