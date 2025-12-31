'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LICENSING_PLANS, recommendPlan } from '@/lib/licensing/plans'
import { useTenantBrand } from '@/lib/branding/useTenantBrand'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    churchName: '',
    city: '',
    country: '',
    estimatedMembers: '',
    planId: '',
  })
  const [hasManualPlanSelection, setHasManualPlanSelection] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [slugInput, setSlugInput] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle')
  const { brand } = useTenantBrand()

  // Global escape key handler to close stuck modals/overlays
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Force close any stuck loading states or modals
        setLoading(false)
        setError('')
        
        // Remove any stuck overlays
        const overlays = document.querySelectorAll('[class*="fixed"][class*="inset-0"]')
        overlays.forEach(overlay => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay)
          }
        })
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'estimatedMembers' ? value.replace(/[^0-9]/g, '') : value,
    }))
    setError('')
    if (name === 'estimatedMembers') {
      setHasManualPlanSelection(false)
    }
  }

  const numericMembers = Number(formData.estimatedMembers) || undefined

  const recommendedPlanId = useMemo(() => {
    const rec = recommendPlan({
      memberCount: numericMembers,
    })
    return rec?.id || LICENSING_PLANS[0].id
  }, [numericMembers])

  const activePlanId = hasManualPlanSelection ? formData.planId || recommendedPlanId : recommendedPlanId

  const slugPreview = useMemo(() => slugify(formData.churchName || 'your-church'), [formData.churchName])

  useEffect(() => {
    if (!slugEdited) {
      setSlugInput(slugPreview)
    }
  }, [slugPreview, slugEdited])

  useEffect(() => {
    if (!slugInput) {
      setSlugStatus('idle')
      return
    }

    let cancelled = false
    const controller = new AbortController()

    setSlugStatus('checking')
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/churches/slug/${slugInput}`, {
          signal: controller.signal,
        })
        if (cancelled) return
        if (response.ok) {
          setSlugStatus('taken')
        } else if (response.status === 404) {
          setSlugStatus('available')
        } else {
          setSlugStatus('error')
        }
      } catch (err: any) {
        if (!cancelled) {
          if (err?.name === 'AbortError') return
          setSlugStatus('error')
        }
      }
    }, 400)

    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timeout)
    }
  }, [slugInput])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    // Add timeout to prevent stuck loading state
    const timeoutId = setTimeout(() => {
      setLoading(false)
      setError('Request timed out. Please try again.')
    }, 30000) // 30 second timeout

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      if (!slugInput) {
        setError('Please provide a slug for your church.')
        setLoading(false)
        return
      }

      if (slugStatus === 'taken') {
        setError('Slug already in use. Please choose another.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          churchName: formData.churchName,
          city: formData.city || undefined,
          country: formData.country || undefined,
          estimatedMembers: numericMembers,
          planId: activePlanId,
          slug: slugInput,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        clearTimeout(timeoutId)
        setError(data.error || 'Registration failed. Please try again.')
        setLoading(false)
        return
      }

      // Success - redirect to login with success message
      clearTimeout(timeoutId)
      router.push('/auth/login?registered=true')
    } catch (err) {
      clearTimeout(timeoutId)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-12">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <img src={brand.logo} alt={brand.name} className="w-10 h-10 object-contain" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {brand.name}
            </span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Your Church</h1>
          <p className="text-gray-600">{brand.tagline || 'Start your 30-day free trial today'}</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 text-gray-900"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 text-gray-900"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="estimatedMembers" className="block text-sm font-semibold text-gray-700 mb-2">
                  Estimated Members
                </label>
                <input
                  id="estimatedMembers"
                  name="estimatedMembers"
                  type="number"
                  min={0}
                  value={formData.estimatedMembers}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="e.g. 250"
                />
                <p className="mt-1 text-xs text-gray-500">Used to recommend the best plan for your church.</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Choose a plan</p>
                <div className="space-y-4">
                  {LICENSING_PLANS.map((plan) => {
                    const isRecommended = plan.id === recommendedPlanId
                    const isSelected = activePlanId === plan.id
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, planId: plan.id }))
                          setHasManualPlanSelection(true)
                        }}
                        className={`w-full text-left rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-semibold text-gray-900">{plan.name}</p>
                            <p className="text-sm text-gray-600">{plan.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-semibold text-gray-900">
                              ${plan.priceMonthlyRange.min}–{plan.priceMonthlyRange.max}/mo
                            </p>
                            <p className="text-xs text-gray-500">
                              ${plan.priceAnnualRange.min}–{plan.priceAnnualRange.max}/yr
                            </p>
                            {isRecommended && !hasManualPlanSelection && (
                              <span className="mt-1 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                                Recommended
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                          {plan.features.slice(0, 3).map((feature) => (
                            <span key={feature} className="rounded-full bg-white/80 px-2 py-1 text-gray-700 shadow-inner">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Church Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Church Information & Plan</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="churchName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Church Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="churchName"
                  name="churchName"
                  type="text"
                  value={formData.churchName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Grace Community Church"
                />
                <div className="mt-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  <p className="font-semibold text-gray-800">Your church slug will be:</p>
                  <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="font-mono text-base text-gray-900">/{slugInput}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={
                          slugStatus === 'available'
                            ? 'text-green-600'
                            : slugStatus === 'taken'
                              ? 'text-red-600'
                              : slugStatus === 'checking'
                                ? 'text-blue-600'
                                : 'text-gray-500'
                        }
                      >
                        {slugStatus === 'available' && 'Slug available'}
                        {slugStatus === 'taken' && 'Slug already in use'}
                        {slugStatus === 'checking' && 'Checking availability...'}
                        {slugStatus === 'error' && 'Unable to verify slug'}
                        {slugStatus === 'idle' && 'Enter your preferred slug'}
                      </span>
                      {slugEdited && (
                        <button
                          type="button"
                          onClick={() => {
                            setSlugEdited(false)
                            setSlugInput(slugPreview)
                          }}
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Reset suggestion
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Staff will log in at <span className="font-mono text-gray-700">ecclesia.app/login/{slugInput}</span>. You can adjust it later from the superadmin tenant settings.
                  </p>
                  <label htmlFor="slug" className="mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                    customize slug
                  </label>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2">
                    <span className="font-mono text-xs text-gray-500">ecclesia.app/login/</span>
                    <input
                      id="slug"
                      type="text"
                      value={slugInput}
                      onChange={(event) => {
                        setSlugEdited(true)
                        setSlugInput(slugify(event.target.value))
                        setError('')
                      }}
                      className="w-full border-none bg-transparent text-sm font-mono text-gray-900 focus:outline-none"
                      placeholder="your-church"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="United States"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || slugStatus === 'checking' || slugStatus === 'taken'}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : slugStatus === 'taken' ? 'Slug Unavailable' : 'Create Account & Start Free Trial'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Sign in
          </Link>
        </p>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

