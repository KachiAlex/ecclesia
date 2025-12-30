import { NextRequest, NextResponse } from 'next/server'

// Temporarily disabled during build - will be enabled after database migration
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Feature temporarily unavailable' }, { status: 503 })
}

export async function GET() {
  return NextResponse.json({ 
    signatureUrl: null,
    signatureTitle: 'Lead Pastor',
    signatureName: '',
  })
}

export async function PUT() {
  return NextResponse.json({ error: 'Feature temporarily unavailable' }, { status: 503 })
}