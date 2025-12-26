import Link from 'next/link'

export default function GlobalErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 py-16 text-center">
      <div className="max-w-md space-y-4">
        <p className="text-sm uppercase tracking-wide text-gray-500">Error 500</p>
        <h1 className="text-3xl font-semibold text-gray-900">Something went wrong</h1>
        <p className="text-gray-600">
          We&apos;re having trouble loading this page right now. Please refresh or try again in a few minutes.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
