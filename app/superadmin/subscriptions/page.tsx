import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userRole = (session.user as any)?.role
  if (userRole !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  // Get all subscriptions
  const subscriptionsSnapshot = await db.collection(COLLECTIONS.subscriptions).get()
  const subscriptions = subscriptionsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))

  // Get all plans
  const plansSnapshot = await db.collection(COLLECTIONS.subscriptionPlans).get()
  const plans = plansSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-600 mt-2">Manage subscription plans and church subscriptions</p>
      </div>

      {/* Subscription Plans */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan: any) => (
            <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900">{plan.name}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${plan.price}/{plan.billingCycle === 'monthly' ? 'mo' : 'yr'}
              </p>
              {plan.features && (
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  {plan.features.map((feature: string, idx: number) => (
                    <li key={idx}>• {feature}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Subscriptions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Active Subscriptions</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {subscriptions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No subscriptions found</div>
          ) : (
            subscriptions.map((sub: any) => (
              <div key={sub.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Church ID: {sub.churchId}</p>
                    <p className="text-sm text-gray-600">Status: {sub.status}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      sub.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

