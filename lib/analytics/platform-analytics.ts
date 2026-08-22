import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { SubscriptionPlanService } from '@/lib/services/subscription-service'
import type { LandingPlanPaymentStatus, LandingPlanPayment } from '@/lib/services/landing-payment-service'

export type AnalyticsPeriod = 'month' | 'quarter' | 'year'

export interface PlatformAnalytics {
  period: AnalyticsPeriod
  periodLabel: string
  summary: {
    totalChurches: number
    newChurches: number
    newChurchesDelta: number
    totalUsers: number
    newUsers: number
    avgUsersPerChurch: number
    revenue: {
      total: number
      currency: string
      delta: number
      breakdown: { currency: string; amount: number }[]
    }
  }
  growthSeries: { label: string; newChurches: number; revenue: number }[]
  planDistribution: { planId: string; planName: string; count: number; percentage: number }[]
  engagement: {
    trialChurches: number
    suspendedChurches: number
    expiringTrials: number
    paymentsThisPeriod: number
  }
  newChurches: { id: string; name: string; createdAt: string }[]
  atRiskChurches: { id: string; name: string; status: string; note: string }[]
}

export async function getPlatformAnalytics(period: AnalyticsPeriod = 'month'): Promise<PlatformAnalytics> {
  const now = new Date()
  const { current, previous, label } = getPeriodWindows(period, now)

  const [churchSnapshot, userSnapshot, subscriptionSnapshot, paymentSnapshot, plans] = await Promise.all([
    db.collection(COLLECTIONS.churches).get(),
    db.collection(COLLECTIONS.users).get(),
    db.collection(COLLECTIONS.subscriptions).get(),
    db.collection(COLLECTIONS.subscriptionPayments).get(),
    SubscriptionPlanService.findAll(),
  ])

  const churches = churchSnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name || 'Untitled Church',
      createdAt: toDateSafe(data.createdAt),
    }
  })

  const churchMap = new Map(churches.map((church) => [church.id, church]))

  const users = userSnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      createdAt: toDateSafe(data.createdAt),
    }
  })

  const subscriptions = subscriptionSnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      churchId: data.churchId,
      planId: data.planId,
      status: data.status || 'ACTIVE',
      trialEndsAt: toNullableDate(data.trialEndsAt),
      updatedAt: toDateSafe(data.updatedAt),
    }
  })

  const payments = paymentSnapshot.docs
    .map((doc) => {
      const data = doc.data()
      const paidAt = toNullableDate(data.paidAt) || toDateSafe(data.updatedAt) || toDateSafe(data.createdAt)
      return {
        id: doc.id,
        status: data.status || 'INITIATED',
        amount: typeof data.amount === 'number' ? data.amount : Number(data.amount) || 0,
        currency: data.currency || 'USD',
        paidAt,
      }
    })
    .filter((payment) => payment.paidAt !== null)

  const planMap = new Map(plans.map((plan) => [plan.id, plan]))

  const totalChurches = churches.length
  const newChurchesCurrent = churches.filter((church) => church.createdAt >= current.start).length
  const newChurchesPrevious = churches.filter(
    (church) => church.createdAt >= previous.start && church.createdAt < previous.end
  ).length

  const totalUsers = users.length
  const newUsersCurrent = users.filter((user) => user.createdAt >= current.start).length
  const avgUsersPerChurch = totalChurches > 0 ? totalUsers / totalChurches : 0

  const revenueCurrent = computeRevenueForWindow(payments, current.start, current.end)
  const revenuePrevious = computeRevenueForWindow(payments, previous.start, previous.end)

  const revenueBreakdown = aggregateRevenueByCurrency(revenueCurrent)
  const primaryRevenue = revenueBreakdown[0] || { currency: 'USD', amount: 0 }
  const primaryRevenuePrevious = aggregateRevenueByCurrency(revenuePrevious)[0] || { currency: 'USD', amount: 0 }

  const planCounts = new Map<string, number>()
  subscriptions.forEach((sub) => {
    if (!sub.planId) return
    planCounts.set(sub.planId, (planCounts.get(sub.planId) || 0) + 1)
  })
  const totalSubscriptions = subscriptions.length || 1
  const planDistribution = Array.from(planCounts.entries()).map(([planId, count]) => ({
    planId,
    planName: planMap.get(planId)?.name || planId,
    count,
    percentage: Number(((count / totalSubscriptions) * 100).toFixed(1)),
  }))

  const trialSubscriptions = subscriptions.filter((sub) => sub.status === 'TRIAL')
  const suspendedSubscriptions = subscriptions.filter((sub) => sub.status === 'SUSPENDED')
  const expiringTrials = trialSubscriptions.filter((sub) => {
    if (!sub.trialEndsAt) return false
    return sub.trialEndsAt >= now && sub.trialEndsAt <= addDays(now, 14)
  })

  const paymentsThisPeriod = revenueCurrent.length

  const growthSeries = buildMonthlySeries(churches, payments, 6)

  const newChurchesList = churches
    .filter((church) => church.createdAt >= current.start)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .map((church) => ({
      id: church.id,
      name: church.name,
      createdAt: church.createdAt.toISOString(),
    }))

  const atRiskChurches = [...expiringTrials, ...suspendedSubscriptions]
    .slice(0, 5)
    .map((sub) => ({
      id: sub.churchId,
      name: churchMap.get(sub.churchId)?.name || 'Unknown',
      status: sub.status,
      note:
        sub.status === 'SUSPENDED'
          ? 'Suspended'
          : sub.trialEndsAt
          ? `Trial ends ${sub.trialEndsAt.toLocaleDateString()}`
          : 'Needs attention',
    }))

  return {
    period,
    periodLabel: label,
    summary: {
      totalChurches,
      newChurches: newChurchesCurrent,
      newChurchesDelta: newChurchesCurrent - newChurchesPrevious,
      totalUsers,
      newUsers: newUsersCurrent,
      avgUsersPerChurch,
      revenue: {
        total: primaryRevenue.amount,
        currency: primaryRevenue.currency,
        delta: primaryRevenue.amount - primaryRevenuePrevious.amount,
        breakdown: revenueBreakdown,
      },
    },
    growthSeries,
    planDistribution,
    engagement: {
      trialChurches: trialSubscriptions.length,
      suspendedChurches: suspendedSubscriptions.length,
      expiringTrials: expiringTrials.length,
      paymentsThisPeriod,
    },
    newChurches: newChurchesList,
    atRiskChurches,
  }
}

export async function getLandingCheckoutAnalytics(params?: {
  startDate?: Date
  endDate?: Date
  planIds?: string[]
  status?: LandingPlanPaymentStatus[]
}) {
  const { startDate, endDate, planIds, status } = params || {}
  let query: FirebaseFirestore.Query = db.collection(COLLECTIONS.landingPlanPayments)

  if (startDate) {
    query = query.where('createdAt', '>=', startDate)
  }
  if (endDate) {
    query = query.where('createdAt', '<=', endDate)
  }
  if (planIds && planIds.length > 0) {
    query = query.where('planId', 'in', planIds.slice(0, 10))
  }

  type LandingCheckoutRecord = LandingPlanPayment & {
    id: string
  }

  const snapshot = await query.get()
  const documents: LandingCheckoutRecord[] = snapshot.docs.map((doc) => {
    const data = doc.data() as LandingPlanPayment
    return {
      ...data,
      id: doc.id,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      paidAt: data.paidAt ? toDate(data.paidAt) : undefined,
    }
  })
  documents.sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0))

  const filtered = status ? documents.filter((doc) => status.includes(doc.status)) : documents

  const totals = filtered.reduce(
    (acc, doc) => {
      acc.count += 1
      const amount = typeof doc.amount === 'number' ? doc.amount : Number(doc.amount) || 0
      const currency = doc.currency || 'USD'
      acc.amountByCurrency[currency] = (acc.amountByCurrency[currency] || 0) + amount
      acc.byStatus[doc.status] = (acc.byStatus[doc.status] || 0) + 1
      acc.byPlan[doc.planId] = (acc.byPlan[doc.planId] || 0) + 1
      return acc
    },
    {
      count: 0,
      amountByCurrency: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byPlan: {} as Record<string, number>,
    }
  )

  const conversionRate =
    totals.count > 0 && totals.byStatus.PAID
      ? Number(((totals.byStatus.PAID / totals.count) * 100).toFixed(1))
      : 0

  return {
    totals,
    conversionRate,
    entries: filtered,
  }
}

function getPeriodWindows(period: AnalyticsPeriod, now: Date) {
  const current = { start: new Date(now), end: now }
  let months = 1

  if (period === 'month') {
    current.start = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (period === 'quarter') {
    months = 3
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
    current.start = new Date(now.getFullYear(), quarterStartMonth, 1)
  } else {
    months = 12
    current.start = new Date(now.getFullYear(), 0, 1)
  }

  const previousStart = new Date(current.start)
  previousStart.setMonth(previousStart.getMonth() - months)

  const previous = {
    start: previousStart,
    end: current.start,
  }

  const label =
    period === 'month'
      ? 'Monthly Performance'
      : period === 'quarter'
      ? 'Quarterly Performance'
      : 'Annual Performance'

  return { current, previous, label }
}

function computeRevenueForWindow(payments: PaymentRecord[], start: Date, end: Date) {
  return payments.filter((payment) => {
    if (!payment.paidAt) return false
    return payment.paidAt >= start && payment.paidAt <= end && ['PAID', 'APPLIED'].includes(payment.status)
  })
}

function aggregateRevenueByCurrency(payments: PaymentRecord[]) {
  const map = new Map<string, number>()
  payments.forEach((payment) => {
    if (!payment.currency) return
    map.set(payment.currency, (map.get(payment.currency) || 0) + payment.amount)
  })

  return Array.from(map.entries())
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount)
}

function buildMonthlySeries(churches: SimpleChurch[], payments: PaymentRecord[], months: number) {
  const now = new Date()
  const series: { label: string; newChurches: number; revenue: number }[] = []

  for (let i = months - 1; i >= 0; i -= 1) {
    const windowStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const windowEnd = new Date(windowStart.getFullYear(), windowStart.getMonth() + 1, 1)
    const label = windowStart.toLocaleString('default', { month: 'short' })

    const newChurches = churches.filter(
      (church) => church.createdAt >= windowStart && church.createdAt < windowEnd
    ).length

    const revenue = payments
      .filter(
        (payment) => payment.paidAt && payment.paidAt >= windowStart && payment.paidAt < windowEnd && payment.status === 'PAID'
      )
      .reduce((sum, payment) => sum + payment.amount, 0)

    series.push({ label, newChurches, revenue })
  }

  return series
}

function toDateSafe(value: any): Date {
  if (!value) return new Date(0)
  if (value instanceof Date) return value
  return toDate(value)
}

function toNullableDate(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  return toDate(value)
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

type SimpleChurch = { id: string; name: string; createdAt: Date }

type PaymentRecord = {
  id: string
  status: string
  amount: number
  currency: string
  paidAt: Date | null
}
