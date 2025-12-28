import Link from 'next/link'

export default function Custom500() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4 py-16">
      <p className="text-sm uppercase tracking-[0.4em] text-emerald-300">Server error</p>
      <h1 className="mt-4 text-4xl font-semibold text-center">Something broke on our end</h1>
      <p className="mt-3 max-w-xl text-center text-slate-300">
        We&apos;re already investigating. Try refreshing the page in a few seconds or head back to the dashboard
        while we get things back online.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-6 py-3 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 transition"
        >
          Retry
        </button>
        <Link
          href="/"
          className="rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white hover:bg-white/20 transition"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  )
}
