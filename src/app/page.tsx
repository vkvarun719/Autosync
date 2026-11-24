'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  ShieldCheck,
  QrCode,
  Users,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
  CreditCard,
  Lock,
  ChevronRight
} from 'lucide-react'
import AutoSyncLogo from '@/components/Logo'

const DEMO_PERSONAS = [
  {
    name: 'Priya',
    role: 'CS 3rd Year',
    avatar: '👩🏽‍💻',
    index: 0,
  },
  {
    name: 'Rahul',
    role: 'ECE 3rd Year',
    avatar: '👨🏽‍🎓',
    index: 1,
  },
  {
    name: 'Ananya',
    role: 'Mech 2nd Year',
    avatar: '👩🏽‍🔬',
    index: 2,
  }
]

export default function LandingPage() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'demo' | 'login' | 'register'>('demo')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Form states
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [rollId, setRollId] = useState('')
  const [gender, setGender] = useState<'FEMALE' | 'MALE' | 'OTHER'>('FEMALE')
  const [collegeName, setCollegeName] = useState('Delhi Technological University')
  const [defaultUpiId, setDefaultUpiId] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')

  useEffect(() => {
    const userStr = localStorage.getItem('autosync_user')
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr)
        if (parsed?.id) {
          router.push('/dashboard')
        }
      } catch {
        localStorage.removeItem('autosync_user')
      }
    }
  }, [router])

  const openAuthModal = (tab: 'demo' | 'login' | 'register' = 'login') => {
    setActiveTab(tab)
    setErrorMessage('')
    setSuccessMessage('')
    setModalOpen(true)
  }

  const handleDemoLogin = async (personaIndex: number) => {
    setLoading(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'demo-login',
          persona: personaIndex
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to login with student account')

      localStorage.setItem('autosync_user', JSON.stringify(data.user))
      if (data.token) localStorage.setItem('autosync_token', data.token)

      setSuccessMessage(`Welcome, ${data.user.name}! Heading to campus rides...`)
      setTimeout(() => {
        router.push('/dashboard')
      }, 350)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const validDomain = /\.(edu|edu\.in|ac\.in)$/i.test(email.trim())
    if (!validDomain) {
      setErrorMessage('Please use your official college email (.edu, .edu.in, or .ac.in).')
      return
    }

    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        action: activeTab === 'register' ? 'register' : 'login',
        email: email.trim().toLowerCase(),
      }

      if (activeTab === 'register') {
        payload.name = name.trim()
        payload.rollId = rollId.trim()
        payload.gender = gender
        payload.collegeName = collegeName.trim()
        payload.defaultUpiId = defaultUpiId.trim() || undefined
        payload.emergencyContact = emergencyContact.trim() || undefined
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Authentication error')

      localStorage.setItem('autosync_user', JSON.stringify(data.user))
      if (data.token) localStorage.setItem('autosync_token', data.token)

      setSuccessMessage('Verified! Opening rides...')
      setTimeout(() => {
        router.push('/dashboard')
      }, 350)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#f1f3f7] flex flex-col selection:bg-emerald-500 selection:text-[#0f1115]">
      {/* 1. Modern Minimal Navbar */}
      <header className="w-full border-b border-[#262b36] sticky top-0 z-40 bg-[#0f1115]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <AutoSyncLogo size={34} />

          <div className="flex items-center gap-4 sm:gap-6">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-[#9aa1b2] hover:text-white transition duration-150 hidden sm:inline-block"
            >
              How it works
            </a>
            <Link
              href="/login"
              className="h-11 px-5 rounded-xl border border-[#262b36] hover:border-[#363d4d] bg-[#171a21] hover:bg-[#1c202a] text-white text-sm font-semibold transition duration-150 shadow-xs flex items-center justify-center"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:py-20 w-full flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Headline, subline, badges, CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Commute app for RVITM students only</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Share the auto.<br />
              <span className="text-emerald-400">Split the fare.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#9aa1b2] max-w-xl leading-relaxed">
              Share autos from the station with verified students. Pay your fair share via UPI.
            </p>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className="px-3 py-1.5 rounded-lg border border-[#262b36] bg-[#171a21] text-xs font-medium text-[#9aa1b2]">
                📍 300m pickup radius
              </span>
              <span className="px-3 py-1.5 rounded-lg border border-[#262b36] bg-[#171a21] text-xs font-medium text-[#9aa1b2]">
                👥 Max 4 riders
              </span>
              <span className="px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs font-medium text-emerald-400">
                ✨ ₹0 platform fee
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                href="/login"
                className="h-12 px-7 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0f1115] font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition duration-150"
              >
                <span>Get Started</span>
                <ArrowRight size={16} />
              </Link>
              <button
                onClick={() => openAuthModal('demo')}
                className="h-12 px-6 rounded-xl border border-[#262b36] hover:border-emerald-500/40 bg-[#171a21] hover:bg-[#1c202a] text-white font-semibold text-sm flex items-center justify-center gap-2 transition duration-150"
              >
                <Sparkles size={16} className="text-emerald-400" />
                <span>Try Demo</span>
              </button>
            </div>
          </div>

          {/* Right Column: Clean Phone / App Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm rounded-3xl border border-[#262b36] bg-[#171a21] p-5 shadow-2xl space-y-4">
              {/* Mockup Header */}
              <div className="flex items-center justify-between border-b border-[#262b36] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Ride in progress</span>
                </div>
                <span className="text-xs font-semibold text-emerald-400">3 of 3 filled</span>
              </div>

              {/* Route */}
              <div className="bg-[#0f1115] p-3.5 rounded-2xl border border-[#262b36] space-y-2">
                <div className="flex items-center gap-2.5 text-xs font-medium text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span>Metro Station Gate 1</span>
                </div>
                <div className="w-0.5 h-3 bg-[#262b36] ml-1" />
                <div className="flex items-center gap-2.5 text-xs font-medium text-emerald-400">
                  <MapPin size={12} className="shrink-0" />
                  <span>Main Campus Gate</span>
                </div>
              </div>

              {/* Passenger Mockup Slots */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#202530] text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">👩🏽‍💻</span>
                    <div>
                      <span className="font-semibold text-white block">Priya (Lead)</span>
                      <span className="text-[11px] text-[#9aa1b2]">At Gate 1</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">₹30</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#202530] text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">👨🏽‍🎓</span>
                    <div>
                      <span className="font-semibold text-white block">Rahul</span>
                      <span className="text-[11px] text-[#9aa1b2]">2 mins away</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">₹30</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#202530] text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">👩🏽‍🔬</span>
                    <div>
                      <span className="font-semibold text-white block">Ananya</span>
                      <span className="text-[11px] text-[#9aa1b2]">Spotted auto</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">₹30</span>
                </div>
              </div>

              {/* Bottom Total Bar */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#9aa1b2]">
                <span>Auto Total: ₹90 (Split by 3)</span>
                <span className="font-semibold text-white">Auto DL 1R AB 4589</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section id="how-it-works" className="border-t border-[#262b36] py-16 bg-[#171a21]/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              How it works
            </h2>
            <p className="text-sm text-[#9aa1b2]">
              Three simple steps to cheaper and safer daily campus commutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="rounded-2xl border border-[#262b36] bg-[#171a21] p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-base font-bold text-white">Pick your transit stop</h3>
              <p className="text-sm text-[#9aa1b2] leading-relaxed">
                Choose your metro station or bus stop gate and campus destination.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-[#262b36] bg-[#171a21] p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-base font-bold text-white">Match with students</h3>
              <p className="text-sm text-[#9aa1b2] leading-relaxed">
                Get paired instantly with verified students arriving within 10 minutes.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-[#262b36] bg-[#171a21] p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-base font-bold text-white">Split fare via UPI</h3>
              <p className="text-sm text-[#9aa1b2] leading-relaxed">
                Pay your exact share directly to the lead rider with a single UPI scan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section className="py-16 border-t border-[#262b36]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Built for student life
            </h2>
            <p className="text-sm text-[#9aa1b2]">
              Designed to make daily travel simple, affordable, and stress-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-[#262b36] bg-[#171a21] p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <QrCode size={20} />
              </div>
              <h3 className="text-base font-bold text-white">Instant UPI split</h3>
              <p className="text-sm text-[#9aa1b2] leading-relaxed">
                Dynamic QR codes for GPay, PhonePe, and Paytm. Zero platform fees.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-[#262b36] bg-[#171a21] p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-bold text-white">Safety & women-only pool</h3>
              <p className="text-sm text-[#9aa1b2] leading-relaxed">
                Verified college emails, auto plate logging, and 1-tap SOS emergency call.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-[#262b36] bg-[#171a21] p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Users size={20} />
              </div>
              <h3 className="text-base font-bold text-white">Live coordination</h3>
              <p className="text-sm text-[#9aa1b2] leading-relaxed">
                Live seat counter, 10-minute timer, and quick status chips like &quot;At Gate 2&quot;.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Minimal Footer */}
      <footer className="border-t border-[#262b36] py-8 bg-[#0f1115]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9aa1b2]">
          <div className="flex items-center gap-2">
            <AutoSyncLogo size={24} showText={false} />
            <span className="font-semibold text-white">AutoSync</span>
            <span>•</span>
            <span>Share the auto. Split the fare.</span>
          </div>
          <div>
            <span>Peer-to-peer student carpooling utility. Zero platform commission.</span>
          </div>
        </div>
      </footer>

      {/* 6. Auth & Demo Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#171a21] border border-[#262b36] rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-lg border border-[#262b36] text-[#9aa1b2] hover:text-white flex items-center justify-center transition"
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div className="mb-5">
              <h3 className="text-lg font-bold text-white">Welcome to AutoSync</h3>
              <p className="text-xs text-[#9aa1b2] mt-0.5">
                Sign in with college email or try with a demo account.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-[#0f1115] p-1 rounded-xl border border-[#262b36] mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setActiveTab('demo'); setErrorMessage(''); }}
                className={`flex-1 py-2 rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'bg-emerald-500 text-[#0f1115] font-bold shadow-xs'
                    : 'text-[#9aa1b2] hover:text-white'
                }`}
              >
                <Sparkles size={13} />
                <span>Demo</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
                className={`flex-1 py-2 rounded-lg transition-all duration-150 ${
                  activeTab === 'login'
                    ? 'bg-emerald-500 text-[#0f1115] font-bold shadow-xs'
                    : 'text-[#9aa1b2] hover:text-white'
                }`}
              >
                <span>Login</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
                className={`flex-1 py-2 rounded-lg transition-all duration-150 ${
                  activeTab === 'register'
                    ? 'bg-emerald-500 text-[#0f1115] font-bold shadow-xs'
                    : 'text-[#9aa1b2] hover:text-white'
                }`}
              >
                <span>Register</span>
              </button>
            </div>

            {/* Error & Success States */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 text-red-200 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                <span className="font-medium">{successMessage}</span>
              </div>
            )}

            {/* DEMO TAB: Compact Persona Cards (No UPI ID, No Roll Number) */}
            {activeTab === 'demo' && (
              <div className="space-y-2.5">
                <p className="text-xs text-[#9aa1b2] mb-1 font-medium">
                  Select a student persona to explore instantly:
                </p>

                {DEMO_PERSONAS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoLogin(p.index)}
                    className="w-full text-left p-3.5 rounded-xl border border-[#262b36] hover:border-emerald-500/60 bg-[#202530] hover:bg-[#252c3a] transition duration-150 flex items-center justify-between group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.avatar}</span>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {p.name}
                        </div>
                        <div className="text-xs text-[#9aa1b2]">
                          {p.role}
                        </div>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-[#171a21] text-[#9aa1b2] group-hover:text-emerald-400 flex items-center justify-center transition">
                      <ChevronRight size={16} />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* LOGIN / REGISTER TAB */}
            {(activeTab === 'login' || activeTab === 'register') && (
              <form onSubmit={handleCustomAuth} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#9aa1b2] mb-1.5">
                    College Email (.edu, .edu.in, .ac.in)
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu.in"
                    className="w-full text-xs font-medium px-3.5 py-3 rounded-xl border border-[#262b36] bg-[#0f1115] text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                  />
                </div>

                {activeTab === 'register' && (
                  <>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#9aa1b2] mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Aryan Gupta"
                          className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-[#262b36] bg-[#0f1115] text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#9aa1b2] mb-1">
                          Roll / ID
                        </label>
                        <input
                          type="text"
                          required
                          value={rollId}
                          onChange={(e) => setRollId(e.target.value)}
                          placeholder="21BCS045"
                          className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-[#262b36] bg-[#0f1115] text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#9aa1b2] mb-1">
                          Gender
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as 'FEMALE' | 'MALE' | 'OTHER')}
                          className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-[#262b36] bg-[#0f1115] text-white focus:border-emerald-500 outline-none"
                        >
                          <option value="FEMALE">Female (Women pool)</option>
                          <option value="MALE">Male</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#9aa1b2] mb-1">
                          College
                        </label>
                        <input
                          type="text"
                          value={collegeName}
                          onChange={(e) => setCollegeName(e.target.value)}
                          placeholder="Campus name"
                          className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-[#262b36] bg-[#0f1115] text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#9aa1b2] mb-1">
                        Default UPI ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={defaultUpiId}
                        onChange={(e) => setDefaultUpiId(e.target.value)}
                        placeholder="yourname@okaxis"
                        className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-[#262b36] bg-[#0f1115] text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#9aa1b2] mb-1">
                        Emergency Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-[#262b36] bg-[#0f1115] text-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0f1115] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition duration-150 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-[#0f1115]" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>{activeTab === 'register' ? 'Register & Continue' : 'Sign In'}</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
