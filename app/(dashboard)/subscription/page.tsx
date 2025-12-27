import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import { getSubscriptionStatus } from '@/lib/subscription'
import SubscriptionPlans from '@/components/SubscriptionPlans'
import SubscriptionStatus from '@/components/SubscriptionStatus'

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userId = (session.user as any).id
  const church = await getCurrentChurch(userId)

  if (!church) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            No church selected. Please select or create a church first.
          </p>
        </div>
      </div>
    )
  }

  const subscriptionStatus = await getSubscriptionStatus(church.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Subscription & Billing</h1>

      {subscriptionStatus.active && subscriptionStatus.subscription && subscriptionStatus.plan ? (
        <div className="space-y-10">
          <SubscriptionStatus
            churchId={church.id}
            subscription={subscriptionStatus.subscription}
            plan={subscriptionStatus.plan}
            usage={subscriptionStatus.usage!}
            limits={subscriptionStatus.limits!}
          />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Explore other plans</h2>
                <p className="text-sm text-gray-600">
                  Need more seats or storage? Compare higher tiers and switch instantly.
                </p>
              </div>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                Current plan: {subscriptionStatus.plan.name}
              </span>
            </div>
            <SubscriptionPlans churchId={church.id} currentPlanId={subscriptionStatus.plan.id} />
          </div>
        </div>
      ) : subscriptionStatus.plan ? (
        <div className="space-y-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-amber-700 tracking-[0.2em]">Current plan</p>
                <h2 className="text-2xl font-bold text-gray-900">{subscriptionStatus.plan.name}</h2>
                <p className="text-sm text-gray-600">
                  Status: {subscriptionStatus.status || 'INACTIVE'} — activate billing to unlock all features.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-amber-100 text-amber-700">
                Awaiting activation
              </span>
            </div>
            <p className="text-sm text-gray-700">
              You’re currently on the {subscriptionStatus.plan.name} plan. Complete checkout to activate billing or choose another
              plan below.
            </p>
          </div>
          <SubscriptionPlans churchId={church.id} currentPlanId={subscriptionStatus.plan.id} />
        </div>
      ) : (
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">No Active Subscription</h2>
            <p className="text-gray-600">
              Choose a plan to get started with Ecclesia Church App.
            </p>
          </div>
          <SubscriptionPlans churchId={church.id} />
        </div>
      )}
    </div>
  )
}

