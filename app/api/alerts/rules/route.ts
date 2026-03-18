import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { AlertService, type AlertRuleCreate } from '@/lib/services/alert-service'

/**
 * GET /api/alerts/rules
 * Get alert rules for user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const churchId = request.nextUrl.searchParams.get('churchId')

    if (!churchId) {
      return NextResponse.json(
        { success: false, error: 'churchId is required' },
        { status: 400 }
      )
    }

    const rules = await AlertService.getAlertRules(userId, churchId)

    return NextResponse.json({
      success: true,
      rules,
      total: rules.length,
    })
  } catch (error) {
    console.error('Get alert rules error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get alert rules' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/alerts/rules
 * Create a new alert rule
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { churchId, ...ruleData } = body

    if (!churchId) {
      return NextResponse.json(
        { success: false, error: 'churchId is required' },
        { status: 400 }
      )
    }

    const rule = await AlertService.createAlertRule(userId, churchId, ruleData as AlertRuleCreate)

    return NextResponse.json({
      success: true,
      rule,
    })
  } catch (error) {
    console.error('Create alert rule error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create alert rule' },
      { status: 500 }
    )
  }
}
