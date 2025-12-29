import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getPlatformAnalytics, type AnalyticsPeriod } from '@/lib/analytics/platform-analytics'
import clsx from 'clsx'

type AnalyticsPageProps = {
  searchParams?: {
    period?: AnalyticsPeriod
  }
}

const periodOptions: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'year', label: 'Annual' },
]

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userRole = (session.user as any)?.role
  if (userRole !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  const period = (searchParams?.period || 'month') satisfies AnalyticsPeriod
  const analytics = await getPlatformAnalytics(period)

  const formatNumber = (value: number, digits = 0) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: digits,
    }).format(value)

  const formatCurrency = (value: number, currency = analytics.summary.revenue.currency) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-gray-100 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-500">
            Superadmin Intelligence
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-600">{analytics.periodLabel}</p>
        </div>

        <div className="flex gap-2 rounded-full border border-gray-200 bg-white p-1 text-sm shadow-sm">
          {periodOptions.map((option) => (
            <a
              key={option.value}
              href={`?period=${option.value}`}
              className={clsx(
                'rounded-full px-4 py-2 font-medium transition',
                option.value === analytics.period
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {option.label}
            </a>
          ))}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Churches"
          value={formatNumber(analytics.summary.totalChurches)}
          delta={analytics.summary.newChurchesDelta}
          helper={`${formatNumber(analytics.summary.newChurches)} new this period`}
        />
        <SummaryCard
          label="Total Users"
          value={formatNumber(analytics.summary.totalUsers)}
          helper={`${formatNumber(analytics.summary.avgUsersPerChurch, 1)} avg per church`}
        />
        <SummaryCard
          label="Revenue"
          value={formatCurrency(analytics.summary.revenue.total)}
          delta={analytics.summary.revenue.delta}
          helper={`Primary currency: ${analytics.summary.revenue.currency}`}
        />
        <SummaryCard
          label="Payments run"
          value={formatNumber(analytics.engagement.paymentsThisPeriod)}
          helper="Settled in this period"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gray-400">
                Growth pulse
              </p>
              <h2 className="text-xl font-semibold text-gray-900">New churches & revenue</h2>
            </div>
            <span className="text-xs text-gray-500">Last 6 months</span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-6">
            {analytics.growthSeries.map((point) => (
              <div key={point.label} className="flex flex-col gap-3">
                <div className="flex flex-1 flex-col justify-end gap-1 rounded-2xl bg-gray-50 p-2">
                  <Bar value={point.newChurches} max={Math.max(...analytics.growthSeries.map((p) => p.newChurches), 1)} label="New" color="bg-primary-500" />
                  <Bar value={point.revenue} max={Math.max(...analytics.growthSeries.map((p) => p.revenue), 1)} label="Revenue" color="bg-emerald-500" />
                </div>
                <p className="text-center text-xs font-medium text-gray-500">{point.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gray-400">
                Engagement
              </p>
              <h2 className="text-xl font-semibold text-gray-900">Activation funnel</h2>
            </div>
          </div>
          <dl className="mt-6 space-y-4">
            <EngagementStat label="Trial Churches" value={analytics.engagement.trialChurches} />
            <EngagementStat label="Suspended" value={analytics.engagement.suspendedChurches} tone="warning" />
            <EngagementStat label="Trials expiring soon" value={analytics.engagement.expiringTrials} tone="danger" />
          </dl>
          <div className="mt-6 rounded-2xl bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Revenue mix</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              {analytics.summary.revenue.breakdown.map((item) => (
                <li key={item.currency} className="flex items-center justify-between">
                  <span>{item.currency}</span>
                  <span className="font-semibold">{formatCurrency(item.amount, item.currency)}</span>
                </li>
              ))}
              {analytics.summary.revenue.breakdown.length === 0 && (
                <li className="text-sm text-gray-500">No paid invoices in this window.</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gray-400">
                License mix
              </p>
              <h2 className="text-xl font-semibold text-gray-900">Plan distribution</h2>
            </div>
          </div>
          <table className="mt-6 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="pb-3 font-semibold">Plan</th>
                <th className="pb-3 font-semibold">Churches</th>
                <th className="pb-3 font-semibold">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analytics.planDistribution.map((plan) => (
                <tr key={plan.planId} className="text-gray-700">
                  <td className="py-3 font-medium">{plan.planName}</td>
                  <td className="py-3">{formatNumber(plan.count)}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{ width: `${plan.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-500">{plan.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {analytics.planDistribution.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-sm text-gray-500">
                    No subscriptions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gray-400">
                  New logos
                </p>
                <h2 className="text-xl font-semibold text-gray-900">Recent onboardings</h2>
              </div>
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              {analytics.newChurches.map((church) => (
                <li key={church.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="font-semibold text-gray-900">{church.name}</p>
                  <p className="text-xs text-gray-500">
                    Joined {new Date(church.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
              {analytics.newChurches.length === 0 && (
                <li className="text-sm text-gray-500">No new churches in this period.</li>
              )}
            </ul>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gray-400">
                  At risk
                </p>
                <h2 className="text-xl font-semibold text-gray-900">Follow-up queue</h2>
              </div>
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              {analytics.atRiskChurches.map((church) => (
                <li key={church.id} className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2">
                  <p className="font-semibold text-gray-900">{church.name}</p>
                  <p className="text-xs text-amber-700">{church.note}</p>
                </li>
              ))}
              {analytics.atRiskChurches.length === 0 && (
                <li className="text-sm text-gray-500">No attention required at the moment.</li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  helper,
  delta,
}: {
  label: string
  value: string
  helper?: string
  delta?: number
}) {
  const trend = delta === undefined ? null : delta === 0 ? 'neutral' : delta > 0 ? 'up' : 'down'

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gray-400">{label}</p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-gray-900">{value}</span>
        {trend && (
          <span
            className={clsx(
              'text-sm font-semibold',
              trend === 'up' && 'text-emerald-600',
              trend === 'down' && 'text-rose-600',
              trend === 'neutral' && 'text-gray-500'
            )}
          >
            {trend === 'up' ? '+' : ''}
            {delta}
          </span>
        )}
      </div>
      {helper && <p className="mt-2 text-sm text-gray-500">{helper}</p>}
    </div>
  )
}

function EngagementStat({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number
  tone?: 'default' | 'warning' | 'danger'
}) {
  const toneClasses =
    tone === 'warning'
      ? 'text-amber-600 bg-amber-50 border-amber-100'
      : tone === 'danger'
      ? 'text-rose-600 bg-rose-50 border-rose-100'
      : 'text-gray-900 bg-gray-50 border-gray-100'

  return (
    <div className={clsx('rounded-2xl border px-4 py-3', toneClasses)}>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}

function Bar({
  value,
  max,
  label,
  color,
}: {
  value: number
  max: number
  label: string
  color: string
}) {
  const height = max === 0 ? 0 : Math.max((value / max) * 100, 4)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex w-full flex-col justify-end rounded-xl bg-white p-1">
        <div className={clsx('w-full rounded-lg', color)} style={{ height: `${height}%` }} />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
    </div>
  )
}

