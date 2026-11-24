'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock,
  PhoneCall,
  CreditCard,
  UserCheck,
  GraduationCap,
  Zap,
  MapPin,
  Car
} from 'lucide-react'
import type { User } from '@/types'

const DEMO_PERSONAS = [
  {
    name: 'Priya Sharma',
    role: 'Female • CS 3rd Year',
    rollId: 'CS2021001',
    email: 'priya.sharma@university.edu.in',
    avatar: '👩🏽‍💻',
    upi: 'priya@okicici',
    index: 0,
    badge: 'Ride Lead',
    gradient: 'from-purple-500/10 to-indigo-500/10 border-indigo-200'
  },
  {
    name: 'Rahul Verma',
    role: 'Male • ECE 3rd Year',
    rollId: 'EC2021042',
    email: 'rahul.verma@university.edu.in',
    avatar: '👨🏽‍🎓',
    upi: 'rahul@okhdfc',
    index: 1,
    badge: 'Co-Rider',
    gradient: 'from-blue-500/10 to-cyan-500/10 border-blue-200'
  },
  {
    name: 'Ananya Singh',
    role: 'Female • Mech 2nd Year',
    rollId: 'ME2022015',
    email: 'ananya.singh@university.edu.in',
    avatar: '👩🏽‍🔬',
    upi: 'ananya@okaxis',
    index: 2,
    badge: 'Women Pool',
    gradient: 'from-pink-500/10 to-rose-500/10 border-pink-200'
  }
]

export default function LandingAuthPage() {
  const router = useRouter()
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
      if (!res.ok) throw new Error(data.error || 'Failed to login with demo student')

      localStorage.setItem('autosync_user', JSON.stringify(data.user))
      if (data.token) localStorage.setItem('autosync_token', data.token)

      setSuccessMessage(`Welcome back, ${data.user.name}! Entering campus network...`)
      setTimeout(() => {
        router.push('/dashboard')
      }, 400)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Demo login failed')
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
      setErrorMessage('Institutional check: Email must belong to an educational domain (.edu, .edu.in, or .ac.in)')
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

      setSuccessMessage('Verified institutional credentials! Entering...')
      setTimeout(() => {
        router.push('/dashboard')
      }, 400)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="pt-2">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-500/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                  AutoSync
                </h1>
                <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded-full border border-indigo-200 tracking-wide uppercase">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase mt-1">
                SMART CAMPUS COMMUTE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/90 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>.EDU VERIFIED</span>
          </div>
        </div>

        {/* Hero Card with Glassmorphic Ambient Gradient */}
        <div className="relative rounded-3xl p-6 text-white shadow-xl shadow-indigo-950/15 mb-6 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-white/10">
          {/* Ambient Glows */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold mb-3.5 border border-white/15">
              <Sparkles size={12} className="text-amber-300" />
              <span className="tracking-wide">Hyper-Local Transit Pooling</span>
            </div>

            <h2 className="text-2xl font-black leading-tight tracking-tight mb-2 text-white">
              Metro to Campus,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-200 to-amber-200">
                Shared in Seconds.
              </span>
            </h2>

            <p className="text-slate-300 text-xs leading-relaxed max-w-[280px]">
              Group with nearby students at transit hubs, split auto & cab fares via dynamic UPI, and commute safer together.
            </p>

            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5">
                <Zap size={13} className="text-amber-400" />
                <span>Zero Commission</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-indigo-400" />
                <span>300m Radar</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>RTO Safe</span>
              </span>
            </div>
          </div>
        </div>

        {/* Sleek Navigation Tabs */}
        <div className="flex bg-slate-100/90 p-1 rounded-2xl mb-5 text-xs font-bold border border-slate-200/80 shadow-xs">
          <button
            type="button"
            onClick={() => { setActiveTab('demo'); setErrorMessage(''); }}
            className={`flex-1 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeTab === 'demo'
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-900/5'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles size={13} />
            <span>1-Click Demo</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
            className={`flex-1 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-900/5'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Student Login</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
            className={`flex-1 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-900/5'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Register</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-2.5 shadow-xs animate-shake">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 shadow-xs">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* DEMO TAB */}
        {activeTab === 'demo' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Select Pre-Seeded Student Persona
              </span>
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                Instant Access
              </span>
            </div>

            {DEMO_PERSONAS.map((p) => (
              <div
                key={p.email}
                onClick={() => !loading && handleDemoLogin(p.index)}
                className={`group relative bg-white border border-slate-200 hover:border-indigo-500 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform shadow-xs border border-slate-200/60">
                    {p.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {p.name}
                      </span>
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full border border-indigo-100 tracking-wide">
                        {p.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {p.role} • <span className="font-mono text-slate-700 font-semibold">{p.rollId}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                      <span>UPI:</span>
                      <span className="text-slate-600">{p.upi}</span>
                    </div>
                  </div>
                </div>

                <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-slate-400 transition-all shadow-xs">
                  {loading ? (
                    <Loader2 size={15} className="animate-spin text-indigo-600 group-hover:text-white" />
                  ) : (
                    <ArrowRight size={15} />
                  )}
                </div>
              </div>
            ))}

            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-center">
              <p className="text-[11px] text-indigo-700 font-medium">
                💡 Tip: Open another browser window to test real-time co-rider coordination!
              </p>
            </div>
          </div>
        )}

        {/* LOGIN / REGISTER FORM */}
        {(activeTab === 'login' || activeTab === 'register') && (
          <form onSubmit={handleCustomAuth} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                College Email Domain (.edu, .edu.in, .ac.in)
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu.in"
                  className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 outline-none transition shadow-xs"
                />
              </div>
            </div>

            {activeTab === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aryan Gupta"
                      className="w-full text-xs font-medium px-3.5 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-600 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Student Roll / ID
                    </label>
                    <input
                      type="text"
                      required
                      value={rollId}
                      onChange={(e) => setRollId(e.target.value)}
                      placeholder="e.g. 21BCS045"
                      className="w-full text-xs font-medium px-3.5 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-600 outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'FEMALE' | 'MALE' | 'OTHER')}
                      className="w-full text-xs font-medium px-3.5 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 outline-none bg-white transition"
                    >
                      <option value="FEMALE">Female (Women Pool eligible)</option>
                      <option value="MALE">Male</option>
                      <option value="OTHER">Other / Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      College Name
                    </label>
                    <input
                      type="text"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="Campus name"
                      className="w-full text-xs font-medium px-3.5 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-600 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Default UPI ID (for receiving split fare)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Auto-linked</span>
                  </label>
                  <input
                    type="text"
                    value={defaultUpiId}
                    onChange={(e) => setDefaultUpiId(e.target.value)}
                    placeholder="yourname@okaxis / @okhdfc"
                    className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-600 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Emergency Contact Phone</span>
                    <span className="text-[10px] text-rose-500 font-semibold">Safety SOS</span>
                  </label>
                  <input
                    type="tel"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-600 outline-none transition"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <UserCheck size={16} />
                  <span>{activeTab === 'register' ? 'Register & Enter AutoSync' : 'Login with College Email'}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* RTO Compliance Notice Card */}
      <div className="pt-6 pb-2">
        <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 text-slate-800 text-xs font-bold mb-1.5">
            <div className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Lock size={11} />
            </div>
            <span>RTO Compliance & Student Safety Notice</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-500">
            AutoSync operates strictly as a zero-commission, peer-to-peer student commute coordinator. No platform commissions or commercial ride-hailing fees are charged. Riders split metered auto/cab fares directly via dynamic UPI in compliance with student cost-sharing norms.
          </p>
        </div>
      </div>
    </div>
  )
}
