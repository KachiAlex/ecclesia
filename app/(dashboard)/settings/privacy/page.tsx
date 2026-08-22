import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export default async function PrivacyPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Privacy Settings</h1>
        <p className="text-gray-600 mt-2">Control who can see your information and activities.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Profile Visibility</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="radio" name="profile" value="public" className="text-primary-600 focus:ring-primary-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Public - Visible to all church members</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="profile" value="limited" className="text-primary-600 focus:ring-primary-500" />
                <span className="ml-2 text-sm text-gray-700">Limited - Visible to group members only</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="profile" value="private" className="text-primary-600 focus:ring-primary-500" />
                <span className="ml-2 text-sm text-gray-700">Private - Visible to leadership only</span>
              </label>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Contact Information</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Show email address</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Show phone number</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="ml-2 text-sm text-gray-700">Show home address</span>
              </label>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Activity Sharing</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Share attendance status</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="ml-2 text-sm text-gray-700">Share giving activities</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Share group participation</span>
              </label>
            </div>
          </div>

          <div className="border-t pt-6">
            <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Save Privacy Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}