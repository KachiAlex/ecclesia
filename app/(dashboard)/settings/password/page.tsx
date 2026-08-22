import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import PasswordChangeForm from '@/components/PasswordChangeForm'

export default async function PasswordPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Change Password</h1>
        <p className="text-gray-600 mt-2">Update your account password for security.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <PasswordChangeForm />
      </div>
    </div>
  )
}