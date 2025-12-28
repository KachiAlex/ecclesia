'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface SlugShareCardProps {
  slug: string
  className?: string
}

export default function SlugShareCard({ slug, className }: SlugShareCardProps) {
  const [copied, setCopied] = useState(false)
  const loginUrl = `ecclesia.app/login/${slug}`

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator?.clipboard) {
        await navigator.clipboard.writeText(loginUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      console.error('slug.share.copy_failed', error)
    }
  }

  return (
    <div className={`rounded-2xl border border-blue-100 bg-blue-50/60 p-5 shadow-inner ${className ?? ''}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Church slug</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">/{slug}</p>
      <p className="mt-1 text-sm text-blue-900">Share this link with tenant admins:</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm text-gray-900 bg-white px-3 py-1.5 rounded-xl border border-blue-100">
          {loginUrl}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-600 hover:text-white transition"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}
