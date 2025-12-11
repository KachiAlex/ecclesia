import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { requirePermissionMiddleware } from '@/lib/middleware/rbac'
import AdminDashboard from '@/components/AdminDashboard'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const { error } = await requirePermissionMiddleware('view_analytics')
  if (error) {
    redirect('/dashboard')
  }

  return <AdminDashboard />
}

