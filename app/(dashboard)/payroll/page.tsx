import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { requirePermissionMiddleware } from '@/lib/middleware/rbac'
import PayrollDashboard from '@/components/PayrollDashboard'

export default async function PayrollPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const { error } = await requirePermissionMiddleware('view_payroll')
  if (error) {
    redirect('/dashboard')
  }

  return <PayrollDashboard />
}

