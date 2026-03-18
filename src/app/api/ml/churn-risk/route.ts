/**
 * API Route: Churn Risk Analysis
 * Endpoint: GET /api/ml/churn-risk
 * Analyzes which members are at risk of dropping out
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { mlPredictionService } from '@/lib/services/ml-prediction-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const churchId = searchParams.get('churchId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!churchId) {
      return NextResponse.json(
        { error: 'churchId is required' },
        { status: 400 }
      )
    }

    const analysis = await mlPredictionService.analyzeChurnRisk(churchId)

    return NextResponse.json({
      success: true,
      atriskCount: analysis.length,
      members: analysis.slice(0, limit),
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Churn risk analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze churn risk' },
      { status: 500 }
    )
  }
}
