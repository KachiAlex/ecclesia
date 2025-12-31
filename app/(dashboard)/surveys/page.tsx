import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import SurveysHub from '@/components/SurveysHub'

export default async function SurveysPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userRole = (session.user as any).role
  
  // Determine user permissions for surveys
  const canCreateSurveys = ['ADMIN', 'SUPER_ADMIN', 'PASTOR', 'BRANCH_ADMIN', 'LEADER'].includes(userRole)
  const canManageAllSurveys = ['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)

  return (
    <SurveysHub 
      userRole={userRole}
      canCreateSurveys={canCreateSurveys}
      canManageAllSurveys={canManageAllSurveys}
    />
  )
}