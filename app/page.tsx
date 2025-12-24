'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  Bot,
  Users2,
  MessageCircle,
  Tv,
  PiggyBank,
  CalendarDays,
  Trophy,
  BarChart3,
  UsersRound,
  CreditCard,
  Wallet,
  Building2,
  type LucideIcon,
} from 'lucide-react'
import { plans } from '@/lib/plans-data'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    setMounted(true)
    
    // Scroll detection for navbar
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    
    // Intersection Observer for animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in')
          }
        })
      },
      { threshold: 0.1 }
    )

    return () => {
      window.removeEventListener('scroll', handleScroll)
      observerRef.current?.disconnect()
    }
  }, [])

  const features: {
    icon: LucideIcon
    title: string
    description: string
    gradient: string
    color: string
    details: string[]
  }[] = [
    {
      icon: Bot,
      title: 'AI-Powered Discipleship',
      description: 'Personalized spiritual growth plans, AI coaching chat, and automated follow-up systems for new converts',
      gradient: 'from-emerald-500 to-teal-600',
      color: 'emerald',
      details: ['AI Spiritual Coach', 'Reading Plan Recommendations', '7-Day Follow-up Automation', 'Mentor Assignment'],
    },
    {
      icon: Users2,
      title: 'Member Management',
      description: 'Comprehensive member directory with role-based access control, payroll system, and visitor conversion',
      gradient: 'from-blue-500 to-cyan-600',
      color: 'blue',
      details: ['6 Role Types', '18+ Permissions', 'Payroll System', 'Visitor Pipeline'],
    },
    {
      icon: MessageCircle,
      title: 'Social Network',
      description: 'Community feed, groups, prayer wall, and real-time messaging to keep everyone connected',
      gradient: 'from-amber-500 to-orange-600',
      color: 'amber',
      details: ['Community Feed', 'Prayer Wall', 'Groups & Departments', 'Real-time Messaging'],
    },
    {
      icon: Tv,
      title: 'Sermon Hub',
      description: 'Netflix-style streaming with AI summaries, offline downloads, and personalized recommendations',
      gradient: 'from-purple-500 to-pink-600',
      color: 'purple',
      details: ['Video/Audio Player', 'AI Summaries', 'Offline Downloads', 'Progress Tracking'],
    },
    {
      icon: PiggyBank,
      title: 'Giving & Finance',
      description: 'Project-based giving with full transparency, financial tracking, and automated receipts',
      gradient: 'from-rose-500 to-red-600',
      color: 'rose',
      details: ['Project Giving', 'Giving Streaks', 'Financial Dashboard', 'PDF Receipts'],
    },
    {
      icon: CalendarDays,
      title: 'Event System',
      description: 'Smart calendar, event registration with QR codes, and check-in system',
      gradient: 'from-indigo-500 to-blue-600',
      color: 'indigo',
      details: ['Smart Calendar', 'QR Ticketing', 'Event Check-in', 'Registration Tracking'],
    },
    {
      icon: Trophy,
      title: 'Gamification',
      description: 'Badges, leaderboards, and XP levels to encourage engagement and spiritual growth',
      gradient: 'from-yellow-500 to-amber-600',
      color: 'yellow',
      details: ['Spiritual Badges', 'Leaderboards', 'XP System', 'Level Progression'],
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Engagement analytics, disengagement warnings, and first-timer pipeline tracking',
      gradient: 'from-violet-500 to-purple-600',
      color: 'violet',
      details: ['Engagement Metrics', 'Disengagement Alerts', 'First-timer Pipeline', 'Workforce Management'],
    },
    {
      icon: UsersRound,
      title: 'Family Module',
      description: 'Parent dashboard, secure children check-in, and family devotion mode',
      gradient: 'from-green-500 to-emerald-600',
      color: 'green',
      details: ['Parent Dashboard', 'Children Check-in', 'Family Devotions', 'Family Groups'],
    },
    {
      icon: CreditCard,
      title: 'Digital Membership',
      description: 'QR code check-in, digital membership cards, and location-based group matching',
      gradient: 'from-cyan-500 to-blue-600',
      color: 'cyan',
      details: ['QR Check-in', 'Digital Cards', 'Location Matching', 'Service Tracking'],
    },
    {
      icon: Wallet,
      title: 'Payroll System',
      description: 'Complete payroll management with positions, wage scales, and automated calculations',
      gradient: 'from-slate-500 to-gray-600',
      color: 'slate',
      details: ['Position Management', 'Wage Scales', 'Payroll Calculation', 'Payment Tracking'],
    },
    {
      icon: Building2,
      title: 'Multi-Tenant SaaS',
      description: 'Church switching, custom branding, subscription management, and usage tracking',
      gradient: 'from-pink-500 to-rose-600',
      color: 'pink',
      details: ['Church Switching', 'Custom Branding', 'Subscription Plans', 'Usage Tracking'],
    },
  ]

  // Auto-rotate features - temporarily disabled
  // useEffect(() => {
  //   if (features.length === 0) return
  //   const interval = setInterval(() => {
  //     setActiveFeature((prev) => (prev + 1) % features.length)
  //   }, 5000)
  //   return () => clearInterval(interval)
  // }, [])

  // const testimonials = [
  //   { name: 'Pastor Michael Johnson', role: 'Senior Pastor', church: 'Grace Community Church', content: 'Ecclesia has transformed how we engage with our congregation.', rating: 5, avatar: '👨‍💼' },
  //   { name: 'Sarah Williams', role: 'Church Administrator', church: 'Hope Fellowship', content: 'The payroll system alone saves us hours every week.', rating: 5, avatar: '👩‍💼' },
  //   { name: 'Pastor David Chen', role: 'Lead Pastor', church: 'New Life Church', content: 'The sermon hub with AI summaries is incredible.', rating: 5, avatar: '👨‍💼' },
  //   { name: 'Emily Rodriguez', role: "Children's Ministry Director", church: 'Faith Church', content: "The family module makes managing children's check-in so easy.", rating: 5, avatar: '👩‍🏫' },
  // ]
  const testimonials: any[] = []

  return (
    <main className="min-h-screen bg-white overflow-hidden">
      {/* Hero background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <img
          src="/home-bg.svg"
          alt="Ecclesia brand background"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-white/55 backdrop-blur-[1px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/10 to-white/60"></div>
      </div>

      {/* Enhanced Navigation */}
      <nav
        className={`relative z-50 backdrop-blur-md transition-all duration-300 ${
          isScrolled ? 'bg-white/95 shadow-lg border-b border-gray-100' : 'bg-white/80 border-b border-gray-100/50'
        } sticky top-0`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <img src="/ecclesia%20logo.svg" alt="Ecclesia" className="w-9 h-9 object-contain" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Ecclesia
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Features</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Testimonials</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Pricing</a>
            </div>
            <div className="flex items-center">
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 text-sm md:text-base"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative z-10 pt-16 md:pt-18 pb-10 md:pb-16 lg:pt-24 lg:pb-18">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div
              className={`transition-all duration-1000 ease-out ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full mb-8 animate-fade-in">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-blue-700">AI-Powered Discipleship Platform</span>
                <span className="hidden sm:inline text-xs text-blue-600">• Trusted by 100+ Churches</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
                Transform Your
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                  Church Community
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-600 mb-8 md:mb-12 max-w-4xl leading-relaxed font-light">
                The most comprehensive church management platform with{' '}
                <span className="font-semibold text-gray-900">AI-powered discipleship</span>,{' '}
                <span className="font-semibold text-gray-900">community engagement</span>, and{' '}
                <span className="font-semibold text-gray-900">spiritual growth tools</span> — all in one place.
              </p>

              {/* Stats Row */}
              <div className="flex flex-wrap gap-6 md:gap-8 mb-8 md:mb-10">
                {[
                  { value: '100+', label: 'Churches' },
                  { value: '10K+', label: 'Active Users' },
                  { value: '12', label: 'Core Features' },
                  { value: '24/7', label: 'Support' },
                ].map((stat, index) => (
                  <div key={index} className="flex items-baseline gap-2">
                    <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm md:text-base text-gray-500 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
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
                  Church Login
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section id="features" className="relative z-10 pt-8 pb-14 md:pt-12 md:pb-22 lg:pt-16 lg:pb-26 bg-gradient-to-b from-white via-gray-50/30 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 md:mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 tracking-tight">
                Everything You Need to
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Grow Your Church
                </span>
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto font-light">
                12 powerful feature modules designed to help your church community thrive
              </p>
            </div>

            {/* Feature Tabs */}
            <div className="mb-12 overflow-x-auto">
              <div className="flex gap-2 md:gap-4 pb-4 min-w-max md:min-w-0 md:flex-wrap md:justify-center">
                {features.map((feature, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveFeature(index)}
                    className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium text-sm md:text-base whitespace-nowrap transition-all duration-300 ${
                      activeFeature === index
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {feature.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Feature Display */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-14">
              <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-xl flex flex-col h-full">
                  {(() => {
                    const ActiveIcon = features[activeFeature].icon
                    return (
                      <div className={`w-20 h-20 bg-gradient-to-br ${features[activeFeature].gradient} rounded-2xl flex items-center justify-center text-4xl text-white mb-6 shadow-lg`}>
                        <ActiveIcon className="w-10 h-10" />
                      </div>
                    )
                  })()}
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {features[activeFeature].title}
                  </h3>
                  <p className="text-lg md:text-xl text-gray-600 mb-6 leading-relaxed">
                    {features[activeFeature].description}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {features[activeFeature].details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-gray-700">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${features[activeFeature].gradient}`}></div>
                        <span className="text-base md:text-lg">{detail}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto space-y-5">
                    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">What leaders say</p>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        {[
                          { value: '92%', label: 'Faster follow-ups' },
                          { value: '3x', label: 'Engagement' },
                          { value: '24/7', label: 'AI Support' },
                        ].map((stat) => (
                          <div key={stat.label}>
                            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-[0.3em] mb-2">Automation recipes</p>
                      <div className="space-y-3">
                        {[
                          'Route first-timers to mentors after 2 days',
                          'Trigger reading-plan nudges when streak < 3 days',
                          'Notify pastors when discipleship score dips below 70',
                        ].map((item) => (
                          <div key={item} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600"></span>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`transition-all duration-500 delay-100 ${
                  mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                }`}
              >
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 md:p-12 border border-gray-200 shadow-2xl overflow-hidden h-full">
                  <div className="absolute -top-16 -right-10 w-48 h-48 bg-blue-200/50 rounded-full blur-3xl"></div>
                  <div className="relative space-y-6 h-full flex flex-col">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-blue-500 font-semibold">Reading Plan</p>
                          <h4 className="text-xl font-bold text-gray-900">30-Day Gospel Immersion</h4>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                          Day 12
                        </span>
                      </div>
                      <div className="space-y-3">
                        {[
                          { day: 'Day 10', title: 'Luke 8 • Mark 3', status: 'Completed' },
                          { day: 'Day 11', title: 'Luke 9 • Psalm 34', status: 'Completed' },
                          { day: 'Day 12', title: 'John 4 • Proverbs 3', status: 'In Progress' },
                          { day: 'Day 13', title: 'Acts 2 • Psalm 27', status: 'Up next' },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 bg-gray-50/60"
                          >
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{item.day}</p>
                              <p className="text-sm font-medium text-gray-900">{item.title}</p>
                            </div>
                            <span
                              className={`text-xs font-semibold ${
                                item.status === 'Completed'
                                  ? 'text-emerald-600'
                                  : item.status === 'In Progress'
                                  ? 'text-indigo-600'
                                  : 'text-gray-500'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl p-5 shadow-xl">
                        <p className="text-xs uppercase tracking-[0.2em] opacity-80 mb-2">AI Coach</p>
                        <p className="text-lg font-semibold mb-3">Discipleship Insights</p>
                        <ul className="space-y-2 text-sm text-blue-50">
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-white/80 rounded-full"></span>
                            Recommend prayer focus on gratitude
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-white/80 rounded-full"></span>
                            Invite mentor follow-up on Day 14
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-white/80 rounded-full"></span>
                            Celebrate 10-day streak 🎉
                          </li>
                        </ul>
                      </div>
                      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 flex flex-col justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Next Action</p>
                          <h5 className="text-lg font-bold text-gray-900 mt-1 mb-3">AI Discipleship Coaching</h5>
                          <p className="text-sm text-gray-600">
                            Schedule a 1:1 check-in or let the AI mentor send a personalized encouragement.
                          </p>
                        </div>
                        <button className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold">
                          Launch Coach
                        </button>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-4">Progress</p>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Completion</span>
                              <span>65%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 w-2/3"></div>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Current streak</span>
                            <span className="font-semibold text-gray-900">11 days 🔥</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Mentor check-ins</span>
                            <span className="font-semibold text-gray-900">Every Friday</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* All Features Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  gradient={feature.gradient}
                  color={feature.color}
                  delay={index * 50}
                  mounted={mounted}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-20 md:py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 md:mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 tracking-tight">
                Simple, Transparent
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Pricing
                </span>
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto font-light">
                Choose the plan that fits your church size and needs
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`relative bg-white rounded-3xl p-6 md:p-8 border-2 transition-all duration-500 transform hover:-translate-y-2 ${
                    plan.popular
                      ? 'border-blue-500 shadow-2xl scale-105'
                      : 'border-gray-200 shadow-lg hover:shadow-xl'
                  } ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-full">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl md:text-5xl font-extrabold text-gray-900">{plan.price}</span>
                      {plan.period && <span className="text-gray-600">{plan.period}</span>}
                    </div>
                    <p className="text-gray-600 text-sm md:text-base">{plan.description}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 text-sm md:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={`block w-full text-center py-3 md:py-4 rounded-xl font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gray-200 text-gray-500'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {plan.cta} (Coming Soon)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 py-20 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-12 md:p-16 lg:p-20 text-center text-white shadow-2xl">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 tracking-tight">
                  Ready to Transform Your Church?
                </h2>
                <p className="text-lg md:text-xl lg:text-2xl mb-8 md:mb-10 opacity-95 font-light max-w-2xl mx-auto">
                  Join hundreds of churches already using Ecclesia to grow their communities and deepen discipleship
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
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
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative z-10 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">About</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Terms</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-8 text-center">
            <p className="text-gray-500 text-sm md:text-base">
              &copy; {new Date().getFullYear()} Ecclesia Church App. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
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
  icon: LucideIcon
  title: string
  description: string
  gradient: string
  color: string
  delay: number
  mounted: boolean
}) {
  const Icon = icon
  return (
    <div
      className={`group relative bg-white rounded-3xl p-6 md:p-8 lg:p-10 border border-gray-100 hover:border-gray-200 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`}></div>
      
      <div className="relative z-10">
        <div className={`relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-2xl md:text-3xl lg:text-4xl mb-4 md:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500 text-white`}>
          <Icon className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9" />
        </div>
        <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4 group-hover:text-gray-800 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed text-sm md:text-base lg:text-lg">{description}</p>
      </div>
    </div>
  )
}
