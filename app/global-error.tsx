/* eslint-disable @next/next/no-img-element */
'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global app error:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-widest text-emerald-300">
              Something went wrong
            </p>
            <h1 className="text-3xl font-semibold">We hit an unexpected error</h1>
            <p className="text-slate-300">
              Our team has been notified. You can retry the last action or return to the dashboard while we sort
              things out.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-6 py-3 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 transition"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white hover:bg-white/20 transition"
            >
              Back to dashboard
            </Link>
          </div>

          {error?.digest && (
            <p className="text-xs text-slate-500">
              Error reference: <span className="font-mono">{error.digest}</span>
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
