import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import SermonUploadForm from '@/components/SermonUploadForm'

export default async function SermonUploadPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  const userRole = (session.user as any).role
  if (!['ADMIN', 'SUPER_ADMIN', 'PASTOR'].includes(userRole)) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Upload Sermon</h1>
        <p className="text-gray-600">
          Upload sermons as files or provide URLs from YouTube, Vimeo, Telegram, or direct links
        </p>
      </div>

      <SermonUploadForm />
    </div>
  )
}

