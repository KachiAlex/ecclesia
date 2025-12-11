'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <main className="min-h-screen bg-white overflow-hidden">
      {/* Elegant background pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.05),transparent_50%)]"></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.03]"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 backdrop-blur-sm bg-white/80 border-b border-gray-100/50 sticky top-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-white font-bold text-xl">E</span>
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Ecclesia
              </span>
            </Link>
            <div className="flex items-center space-x-6">
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 text-[15px]"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="relative px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold text-[15px] transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 group overflow-hidden"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-32 lg:pt-32 lg:pb-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <div
              className={`transition-all duration-1000 ease-out ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full mb-8">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-blue-700">AI-Powered Discipleship Platform</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
                Transform Your
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Church Community
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
                Comprehensive church management platform with{' '}
                <span className="font-semibold text-gray-900">AI-powered discipleship</span>,{' '}
                <span className="font-semibold text-gray-900">community engagement</span>, and{' '}
                <span className="font-semibold text-gray-900">spiritual growth tools</span>
              </p>

              {/* Church Login Form */}
              <div className={`mb-12 transition-all duration-1000 delay-200 ease-out ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>
                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Church Login</h2>
                  <p className="text-gray-600 text-center mb-6">Sign in to your church portal</p>
                  <ChurchLoginForm />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
                <Link
                  href="/auth/register"
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Start Free Trial
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <Link
                  href="/auth/login"
                  className="px-8 py-4 bg-white text-gray-700 rounded-2xl font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto"
                >
                  Admin Sign In
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div
              className={`grid grid-cols-3 gap-8 lg:gap-12 transition-all duration-1000 delay-300 ease-out ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              {[
                { value: '100+', label: 'Churches' },
                { value: '10K+', label: 'Active Users' },
                { value: '24/7', label: 'Support' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm lg:text-base text-gray-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
                Everything You Need
              </h2>
              <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto font-light">
                Powerful features designed to help your church community grow and thrive
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: '👥',
                  title: 'Member Management',
                  description: 'Role-based access control with digital profiles and spiritual metrics',
                  gradient: 'from-blue-500 to-blue-600',
                  color: 'blue',
                },
                {
                  icon: '🤖',
                  title: 'AI Discipleship',
                  description: 'Personalized spiritual growth plans and AI coaching for every member',
                  gradient: 'from-emerald-500 to-emerald-600',
                  color: 'emerald',
                },
                {
                  icon: '💬',
                  title: 'Social Network',
                  description: 'Community feed, groups, and prayer wall to keep everyone connected',
                  gradient: 'from-amber-500 to-amber-600',
                  color: 'amber',
                },
                {
                  icon: '📺',
                  title: 'Sermon Hub',
                  description: 'Netflix-style streaming with AI summaries and personalized recommendations',
                  gradient: 'from-purple-500 to-purple-600',
                  color: 'purple',
                },
                {
                  icon: '💰',
                  title: 'Giving & Finance',
                  description: 'Project-based giving with full transparency and financial tracking',
                  gradient: 'from-rose-500 to-rose-600',
                  color: 'rose',
                },
                {
                  icon: '🏆',
                  title: 'Gamification',
                  description: 'Badges, leaderboards, and XP levels to encourage engagement',
                  gradient: 'from-indigo-500 to-indigo-600',
                  color: 'indigo',
                },
              ].map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  gradient={feature.gradient}
                  color={feature.color}
                  delay={index * 100}
                  mounted={mounted}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-12 lg:p-20 text-center text-white shadow-2xl">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
                  Ready to Transform Your Church?
                </h2>
                <p className="text-xl lg:text-2xl mb-10 opacity-95 font-light max-w-2xl mx-auto">
                  Join thousands of churches already using Ecclesia to grow their communities
                </p>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  Get Started Free
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Ecclesia Church App. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}

function ChurchLoginForm() {
  const router = useRouter()
  const [churchSlug, setChurchSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!churchSlug.trim()) {
      setError('Please enter your church name')
      return
    }

    // Navigate to church login page
    router.push(`/login/${churchSlug.trim().toLowerCase()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="churchSlug" className="block text-sm font-medium text-gray-700 mb-2">
          Church Name
        </label>
        <input
          id="churchSlug"
          type="text"
          value={churchSlug}
          onChange={(e) => setChurchSlug(e.target.value)}
          placeholder="e.g., grace-community-church"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          required
        />
        <p className="mt-1 text-xs text-gray-500">Enter your church name (e.g., "grace-community-church")</p>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Loading...' : 'Continue to Login'}
      </button>
    </form>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
  color,
  delay,
  mounted,
}: {
  icon: string
  title: string
  description: string
  gradient: string
  color: string
  delay: number
  mounted: boolean
}) {
  return (
    <div
      className={`group relative bg-white rounded-3xl p-8 lg:p-10 border border-gray-100 hover:border-gray-200 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Subtle glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`}></div>
      
      <div className="relative z-10">
        <div className={`relative w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-3xl lg:text-4xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
          {icon}
        </div>
        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed text-lg">{description}</p>
      </div>
    </div>
  )
}
