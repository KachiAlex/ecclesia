'use client'

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
    >
      <span>🚪</span>
      <span>Sign Out</span>
    </button>
  )
}
