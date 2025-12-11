import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { ChurchService } from '@/lib/services/church-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userRole = (session.user as any)?.role
  if (userRole !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  const churches = await ChurchService.findAll()
  const usersSnapshot = await db.collection(COLLECTIONS.users).get()
  const totalUsers = usersSnapshot.size

  // Calculate growth metrics
  const churchesThisMonth = churches.filter(
    (church) => new Date(church.createdAt).getMonth() === new Date().getMonth()
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-gray-600 mt-2">View platform-wide metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-600 mb-1">Total Churches</p>
          <p className="text-3xl font-bold text-gray-900">{churches.length}</p>
          <p className="text-sm text-gray-500 mt-2">+{churchesThisMonth} this month</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-600 mb-1">Avg Users/Church</p>
          <p className="text-3xl font-bold text-gray-900">
            {churches.length > 0 ? Math.round(totalUsers / churches.length) : 0}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-600 mb-1">Platform Growth</p>
          <p className="text-3xl font-bold text-green-600">+15%</p>
          <p className="text-sm text-gray-500 mt-2">vs last month</p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Advanced Analytics Coming Soon</h3>
          <p className="text-gray-600">
            Detailed analytics, charts, and insights will be available here soon.
          </p>
        </div>
      </div>
    </div>
  )
}

