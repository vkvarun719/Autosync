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
  UserCheck
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
    badge: 'Demo Lead'
  },
  {
    name: 'Rahul Verma',
    role: 'Male • ECE 3rd Year',
    rollId: 'EC2021042',
    email: 'rahul.verma@university.edu.in',
    avatar: '👨🏽‍🎓',
    upi: 'rahul@okhdfc',
    index: 1,
    badge: 'Co-Rider'
  },
  {
    name: 'Ananya Singh',
    role: 'Female • Mech 2nd Year',
    rollId: 'ME2022015',
    email: 'ananya.singh@university.edu.in',
    avatar: '👩🏽‍🔬',
    upi: 'ananya@okaxis',
    index: 2,
    badge: 'Women-Pool'
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
    // If already logged in, redirect to dashboard
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

      setSuccessMessage(`Logged in as ${data.user.name}! Redirecting...`)
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
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

    // Basic domain check
    const validDomain = /\.(edu|edu\.in|ac\.in)$/i.test(email.trim())
    if (!validDomain) {
      setErrorMessage('Institutional check failed: Email must end in .edu, .edu.in, or .ac.in')
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

      setSuccessMessage('Verified institutional credentials! Redirecting...')
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50">
      {/* Brand & Hero */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-200">
              ⚡
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                AutoSync
              </h1>
              <p className="text-[11px] font-medium text-indigo-600 tracking-wide mt-0.5">
                CAMPUS COMMUTE POOL
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full text-[10px] font-semibold">
            <ShieldCheck size={12} />
            <span>Verified .EDU</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-2xl p-5 text-white shadow-lg shadow-indigo-100 mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium mb-3">
              <Sparkles size={12} className="text-yellow-300" />
              <span>Zero-Commission Student Pooling</span>
            </div>
            <h2 className="text-2xl font-extrabold leading-tight mb-2">
              Metro to Campus, Shared in Seconds.
            </h2>
            <p className="text-indigo-100 text-xs leading-relaxed">
              Coordinate auto-rickshaws and cabs from transit hubs. Split fares fairly via dynamic UPI QR codes.
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('demo'); setErrorMessage(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'demo'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🚀 1-Click Demo
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* DEMO TAB */}
        {activeTab === 'demo' && (
          <div className="space-y-3">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Demo Persona (Instant Multi-Rider Testing)
            </div>

            {DEMO_PERSONAS.map((p) => (
              <div
                key={p.email}
                onClick={() => !loading && handleDemoLogin(p.index)}
                className="group relative bg-white border border-slate-200 hover:border-indigo-400 p-3.5 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                    {p.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">
                        {p.name}
                      </span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-100">
                        {p.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {p.role} • <span className="font-mono">{p.rollId}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      UPI: <span className="font-mono text-slate-600">{p.upi}</span>
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ArrowRight size={14} />
                  )}
                </div>
              </div>
            ))}

            <p className="text-[11px] text-slate-500 text-center pt-2">
              💡 Open in another incognito window to simulate 2 co-riders joining in real-time!
            </p>
          </div>
        )}

        {/* LOGIN / REGISTER FORM */}
        {(activeTab === 'login' || activeTab === 'register') && (
          <form onSubmit={handleCustomAuth} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College Email (.edu, .edu.in, .ac.in)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu.in"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            {activeTab === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aryan Gupta"
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Roll / Student ID
                    </label>
                    <input
                      type="text"
                      required
                      value={rollId}
                      onChange={(e) => setRollId(e.target.value)}
                      placeholder="e.g. 21BCS045"
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'FEMALE' | 'MALE' | 'OTHER')}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white"
                    >
                      <option value="FEMALE">Female (Women Pool eligible)</option>
                      <option value="MALE">Male</option>
                      <option value="OTHER">Other / Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      College Name
                    </label>
                    <input
                      type="text"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="Campus name"
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Default UPI ID (for receiving split fare)</span>
                    <span className="text-[10px] text-slate-400">Optional</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={defaultUpiId}
                      onChange={(e) => setDefaultUpiId(e.target.value)}
                      placeholder="yourname@okaxis / @okhdfc"
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Emergency Contact Number</span>
                    <span className="text-[10px] text-slate-400">Safety SOS</span>
                  </label>
                  <input
                    type="tel"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-100 transition disabled:opacity-50"
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

      {/* Safety & RTO Compliance Notice */}
      <div className="pt-6 pb-2">
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold mb-1">
            <Lock size={12} className="text-indigo-600" />
            <span>RTO Compliance & Student Safety Notice</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-500">
            AutoSync is a zero-commission, peer-to-peer student cost-sharing coordinator. It does NOT charge fees, provide commercial ride services, or take commissions. Riders split metered auto/cab fares directly between each other via peer-to-peer UPI in accordance with student carpooling norms.
          </p>
        </div>
      </div>
    </div>
  )
}
