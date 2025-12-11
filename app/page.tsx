'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

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

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Discipleship',
      description: 'Personalized spiritual growth plans, AI coaching chat, and automated follow-up systems for new converts',
      gradient: 'from-emerald-500 to-teal-600',
      color: 'emerald',
      details: ['AI Spiritual Coach', 'Reading Plan Recommendations', '7-Day Follow-up Automation', 'Mentor Assignment'],
    },
    {
      icon: '👥',
      title: 'Member Management',
      description: 'Comprehensive member directory with role-based access control, payroll system, and visitor conversion',
      gradient: 'from-blue-500 to-cyan-600',
      color: 'blue',
      details: ['6 Role Types', '18+ Permissions', 'Payroll System', 'Visitor Pipeline'],
    },
    {
      icon: '💬',
      title: 'Social Network',
      description: 'Community feed, groups, prayer wall, and real-time messaging to keep everyone connected',
      gradient: 'from-amber-500 to-orange-600',
      color: 'amber',
      details: ['Community Feed', 'Prayer Wall', 'Groups & Departments', 'Real-time Messaging'],
    },
    {
      icon: '📺',
      title: 'Sermon Hub',
      description: 'Netflix-style streaming with AI summaries, offline downloads, and personalized recommendations',
      gradient: 'from-purple-500 to-pink-600',
      color: 'purple',
      details: ['Video/Audio Player', 'AI Summaries', 'Offline Downloads', 'Progress Tracking'],
    },
    {
      icon: '💰',
      title: 'Giving & Finance',
      description: 'Project-based giving with full transparency, financial tracking, and automated receipts',
      gradient: 'from-rose-500 to-red-600',
      color: 'rose',
      details: ['Project Giving', 'Giving Streaks', 'Financial Dashboard', 'PDF Receipts'],
    },
    {
      icon: '📅',
      title: 'Event System',
      description: 'Smart calendar, event registration with QR codes, and check-in system',
      gradient: 'from-indigo-500 to-blue-600',
      color: 'indigo',
      details: ['Smart Calendar', 'QR Ticketing', 'Event Check-in', 'Registration Tracking'],
    },
    {
      icon: '🏆',
      title: 'Gamification',
      description: 'Badges, leaderboards, and XP levels to encourage engagement and spiritual growth',
      gradient: 'from-yellow-500 to-amber-600',
      color: 'yellow',
      details: ['Spiritual Badges', 'Leaderboards', 'XP System', 'Level Progression'],
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Engagement analytics, disengagement warnings, and first-timer pipeline tracking',
      gradient: 'from-violet-500 to-purple-600',
      color: 'violet',
      details: ['Engagement Metrics', 'Disengagement Alerts', 'First-timer Pipeline', 'Workforce Management'],
    },
    {
      icon: '👨‍👩‍👧‍👦',
      title: 'Family Module',
      description: 'Parent dashboard, secure children check-in, and family devotion mode',
      gradient: 'from-green-500 to-emerald-600',
      color: 'green',
      details: ['Parent Dashboard', 'Children Check-in', 'Family Devotions', 'Family Groups'],
    },
    {
      icon: '💳',
      title: 'Digital Membership',
      description: 'QR code check-in, digital membership cards, and location-based group matching',
      gradient: 'from-cyan-500 to-blue-600',
      color: 'cyan',
      details: ['QR Check-in', 'Digital Cards', 'Location Matching', 'Service Tracking'],
    },
    {
      icon: '💼',
      title: 'Payroll System',
      description: 'Complete payroll management with positions, wage scales, and automated calculations',
      gradient: 'from-slate-500 to-gray-600',
      color: 'slate',
      details: ['Position Management', 'Wage Scales', 'Payroll Calculation', 'Payment Tracking'],
    },
    {
      icon: '🏢',
      title: 'Multi-Tenant SaaS',
      description: 'Church switching, custom branding, subscription management, and usage tracking',
      gradient: 'from-pink-500 to-rose-600',
      color: 'pink',
      details: ['Church Switching', 'Custom Branding', 'Subscription Plans', 'Usage Tracking'],
    },
  ]

  const testimonials = [
    {
      name: 'Pastor Michael Johnson',
      role: 'Senior Pastor',
      church: 'Grace Community Church',
      content: 'Ecclesia has transformed how we engage with our congregation. The AI discipleship features help us personalize spiritual growth for every member.',
      rating: 5,
      avatar: '👨‍💼',
    },
    {
      name: 'Sarah Williams',
      role: 'Church Administrator',
      church: 'Hope Fellowship',
      content: 'The payroll system alone saves us hours every week. And the member management is so intuitive - our team loves it!',
      rating: 5,
      avatar: '👩‍💼',
    },
    {
      name: 'Pastor David Chen',
      role: 'Lead Pastor',
      church: 'New Life Church',
      content: 'The sermon hub with AI summaries is incredible. Our members can quickly find relevant content, and engagement has increased significantly.',
      rating: 5,
      avatar: '👨‍💼',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Children\'s Ministry Director',
      church: 'Faith Church',
      content: 'The family module makes managing children\'s check-in so easy. Parents love the digital cards and family devotion features.',
      rating: 5,
      avatar: '👩‍🏫',
    },
  ]

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for small churches getting started',
      features: [
        'Up to 50 members',
        'Basic member management',
        'Community feed',
        'Prayer wall',
        'Basic event calendar',
        'Email support',
      ],
      cta: 'Start Free',
      popular: false,
    },
    {
      name: 'Basic',
      price: '$49',
      period: '/month',
      description: 'For growing churches',
      features: [
        'Up to 200 members',
        'All Free features',
        'AI Discipleship',
        'Sermon Hub',
        'Giving & Finance',
        'Event registration',
        'Priority support',
      ],
      cta: 'Get Started',
      popular: true,
    },
    {
      name: 'Pro',
      price: '$99',
      period: '/month',
      description: 'For established churches',
      features: [
        'Up to 1,000 members',
        'All Basic features',
        'Payroll system',
        'Advanced analytics',
        'Gamification',
        'Custom branding',
        '24/7 support',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations',
      features: [
        'Unlimited members',
        'All Pro features',
        'Multi-church management',
        'Dedicated support',
        'Custom integrations',
        'SLA guarantee',
        'Training & onboarding',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ]

  return (
    <main className="min-h-screen bg-white overflow-hidden">
      {/* Enhanced background with animations */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)] animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.08),transparent_50%)] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.03]"></div>
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Enhanced Navigation */}
      <nav className={`relative z-50 backdrop-blur-md transition-all duration-300 ${
        isScrolled ? 'bg-white/95 shadow-lg border-b border-gray-100' : 'bg-white/80 border-b border-gray-100/50'
      } sticky top-0`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-xl">E</span>
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
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 text-sm md:text-base"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="relative px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold text-sm md:text-base transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 group overflow-hidden"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative z-10 pt-16 md:pt-24 pb-20 md:pb-32 lg:pt-32 lg:pb-40">
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
              <div className="flex flex-wrap gap-6 md:gap-8 mb-8 md:mb-12">
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
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
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
                <Link
                  href="#demo"
                  className="px-8 py-4 bg-transparent text-gray-700 rounded-2xl font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 w-full sm:w-auto"
                >
                  Watch Demo
                </Link>
              </div>

              {/* Church Login Form - Collapsible */}
              <div className={`mb-12 transition-all duration-1000 delay-200 ease-out max-w-md ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 text-center">Church Login</h2>
                  <p className="text-gray-600 text-center mb-6 text-sm md:text-base">Sign in to your church portal</p>
                  <ChurchLoginForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section id="features" className="relative z-10 py-20 md:py-24 lg:py-32 bg-gradient-to-b from-white via-gray-50/30 to-white">
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
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-16">
              <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-xl">
                  <div className={`w-20 h-20 bg-gradient-to-br ${features[activeFeature].gradient} rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-lg`}>
                    {features[activeFeature].icon}
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {features[activeFeature].title}
                  </h3>
                  <p className="text-lg md:text-xl text-gray-600 mb-6 leading-relaxed">
                    {features[activeFeature].description}
                  </p>
                  <ul className="space-y-3">
                    {features[activeFeature].details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-gray-700">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${features[activeFeature].gradient}`}></div>
                        <span className="text-base md:text-lg">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className={`transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 md:p-12 border border-gray-200 shadow-2xl">
                  {/* Mock UI Preview */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${features[activeFeature].gradient} rounded-xl flex items-center justify-center text-2xl`}>
                        {features[activeFeature].icon}
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-50 rounded-lg border border-gray-100"></div>
                      ))}
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

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 py-20 md:py-24 lg:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 md:mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 tracking-tight">
                Loved by Churches
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Everywhere
                </span>
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto font-light">
                See what pastors and administrators are saying about Ecclesia
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 ${
                    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-xl">★</span>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed text-base md:text-lg">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-2xl">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                      <div className="text-xs text-gray-500">{testimonial.church}</div>
                    </div>
                  </div>
                </div>
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
                  <Link
                    href="/auth/register"
                    className={`block w-full text-center py-3 md:py-4 rounded-xl font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </Link>
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
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-semibold text-lg border-2 border-white/30 hover:bg-white/20 transition-all duration-300"
                  >
                    Sign In
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
                <li><Link href="/auth/register" className="text-gray-600 hover:text-gray-900 transition-colors">Sign Up</Link></li>
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
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
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
      className={`group relative bg-white rounded-3xl p-6 md:p-8 lg:p-10 border border-gray-100 hover:border-gray-200 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`}></div>
      
      <div className="relative z-10">
        <div className={`relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-2xl md:text-3xl lg:text-4xl mb-4 md:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
          {icon}
        </div>
        <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4 group-hover:text-gray-800 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed text-sm md:text-base lg:text-lg">{description}</p>
      </div>
    </div>
  )
}
