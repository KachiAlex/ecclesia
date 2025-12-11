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

      {subscriptionStatus.active ? (
        <SubscriptionStatus
          churchId={church.id}
          subscription={subscriptionStatus.subscription!}
          plan={subscriptionStatus.plan!}
          usage={subscriptionStatus.usage!}
          limits={subscriptionStatus.limits!}
        />
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

