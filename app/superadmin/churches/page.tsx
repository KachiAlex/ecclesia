import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { ChurchService } from '@/lib/services/church-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import ChurchesList from '@/components/superadmin/ChurchesList'

export default async function ChurchesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userRole = (session.user as any)?.role
  if (userRole !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  const churches = await ChurchService.findAll()

  // Get user counts for each church
  const churchesWithStats = await Promise.all(
    churches.map(async (church) => {
      const usersSnapshot = await db.collection(COLLECTIONS.users)
        .where('churchId', '==', church.id)
        .get()
      
      const subscriptionSnapshot = await db.collection(COLLECTIONS.subscriptions)
        .where('churchId', '==', church.id)
        .limit(1)
        .get()
      
      const subscription = subscriptionSnapshot.empty ? null : subscriptionSnapshot.docs[0].data()

      return {
        ...church,
        userCount: usersSnapshot.size,
        subscriptionStatus: subscription?.status || 'TRIAL',
      }
    })
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600 mt-2">Manage all church organizations and licenses</p>
        </div>
      </div>

      {/* Churches List with Filters */}
      <ChurchesList churches={churchesWithStats} />
    </div>
  )
}

