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

const CERTIFICATE_FONT_PATH = '/fonts/noto-sans-v27-latin-regular.ttf'
const CERTIFICATE_FONT_NAME = 'certificate-primary'

export class CertificateService {
  private static fontBuffer: Buffer | null = null

  private static async fetchImageBuffer(url?: string | null): Promise<Buffer | null> {
    if (!url) return null
    try {
      const response = await fetch(url)
      if (!response.ok) return null
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.warn('CertificateService.fetchImageBuffer', error)
      return null
    }
  }

  private static resolveAssetBaseUrl(): string {
    const explicit =
      process.env.CERTIFICATE_ASSET_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_VERCEL_URL

    if (explicit && explicit.trim().length) {
      const trimmed = explicit.trim()
      return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    }

    const vercelUrl = process.env.VERCEL_URL || process.env.VERCEL_BRANCH_URL
    if (vercelUrl) {
      return `https://${vercelUrl}`
    }

    return process.env.NODE_ENV === 'production'
      ? 'https://ecclesia-five.vercel.app'
      : 'http://localhost:3000'
  }

  private static async getFontBuffer(): Promise<Buffer> {
    if (this.fontBuffer) {
      return this.fontBuffer
    }

    const baseUrl = this.resolveAssetBaseUrl()
    const fontUrl = new URL(CERTIFICATE_FONT_PATH, baseUrl).toString()
    const response = await fetch(fontUrl)

    if (!response.ok) {
      throw new Error(`Failed to load certificate font (${response.status})`)
    }

    const arrayBuffer = await response.arrayBuffer()
    this.fontBuffer = Buffer.from(arrayBuffer)
    return this.fontBuffer
  }

  static async generateCertificatePdf(input: CertificatePdfInput): Promise<Buffer> {
    const theme = { ...DEFAULT_THEME, ...(input.theme || {}) }
    const doc = new PDFDocument({ size: 'A4', margin: 60 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))

    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
    })

    const pageWidth = doc.page.width
    const pageHeight = doc.page.height

    const fontBuffer = await this.getFontBuffer()
    doc.registerFont(CERTIFICATE_FONT_NAME, fontBuffer)

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

    // Logo
    const logoBuffer = await this.fetchImageBuffer(theme.logoUrl)
    if (logoBuffer) {
      doc.image(logoBuffer, pageWidth / 2 - 50, 50, { fit: [100, 60], align: 'center' })
    }

    doc
      .font(CERTIFICATE_FONT_NAME)
      .fontSize(28)
      .fillColor(theme.secondaryColor)
      .text(theme.sealText || DEFAULT_THEME.sealText, { align: 'center', lineGap: 6 })

    doc
      .fontSize(18)
      .fillColor(theme.accentColor)
      .text('Certificate of Completion', { align: 'center', lineGap: 10 })

    doc.moveDown(2)

    doc
      .font(CERTIFICATE_FONT_NAME)
      .fontSize(12)
      .fillColor(theme.secondaryColor)
      .text('This certifies that', { align: 'center' })

    doc
      .moveDown(0.5)
      .fontSize(24)
      .font(CERTIFICATE_FONT_NAME)
      .text(input.studentName, { align: 'center' })

    doc
      .moveDown(0.5)
      .fontSize(12)
      .font(CERTIFICATE_FONT_NAME)
      .text('has successfully completed', { align: 'center' })

    doc
      .moveDown(0.5)
      .fontSize(18)
      .font(CERTIFICATE_FONT_NAME)
      .text(input.courseTitle, { align: 'center' })

    doc
      .moveDown(1.5)
      .fontSize(11)
      .font(CERTIFICATE_FONT_NAME)
      .text(
        `Awarded on ${input.issuedDate.toLocaleDateString()} by ${theme.issuedBy || input.churchName || 'Ecclesia'}.`,
        { align: 'center' },
      )

    // Signature area
    doc.moveDown(3)
    doc
      .moveTo(pageWidth / 2 - 120, doc.y)
      .lineTo(pageWidth / 2 + 120, doc.y)
      .strokeColor(theme.secondaryColor)
      .lineWidth(1)
      .stroke()

    doc
      .fontSize(12)
      .font(CERTIFICATE_FONT_NAME)
      .text(theme.signatureText || DEFAULT_THEME.signatureText, pageWidth / 2 - 120, doc.y + 5, {
        width: 240,
        align: 'center',
      })

    doc
      .font(CERTIFICATE_FONT_NAME)
      .fontSize(10)
      .text(theme.issuedBy || input.churchName || DEFAULT_THEME.issuedBy, pageWidth / 2 - 120, doc.y, {
        width: 240,
        align: 'center',
      })

    doc.end()
    return done
  }

  static async generateUploadAndAttachCertificate(input: CertificateUploadInput): Promise<{ url: string; path: string }> {
    const pdfBuffer = await this.generateCertificatePdf({
      studentName: input.studentName,
      courseTitle: input.courseTitle,
      issuedDate: new Date(),
      churchName: input.churchName,
      theme: input.theme,
    })

    const fileName = `certificate-${input.courseId}-${input.userId}-${Date.now()}.pdf`
    const upload = await StorageService.uploadFile({
      file: pdfBuffer,
      fileName,
      folder: `digital-school/certificates/${input.courseId}`,
      userId: input.userId,
      contentType: 'application/pdf',
    })

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

    return upload
  }
}
