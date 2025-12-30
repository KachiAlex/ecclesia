import { NextResponse } from 'next/server'
import { CertificateService } from '@/lib/services/certificate-service'

export async function GET() {
  try {
    console.log('Testing certificate generation...')
    
    const pdfBuffer = await CertificateService.generateCertificatePdf({
      studentName: 'Test Student',
      courseTitle: 'Test Course',
      issuedDate: new Date(),
      churchName: 'Test Church',
      theme: null
    })

    console.log('Certificate generated successfully, size:', pdfBuffer.length)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="test-certificate.pdf"'
      }
    })
  } catch (error) {
    console.error('Test certificate generation failed:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}