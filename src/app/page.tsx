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
  Car,
  Activity,
  Layers,
  QrCode,
  Radio
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
    telemetry: '99.4% On-Time'
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
    telemetry: 'Active Commuter'
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
    telemetry: 'Verified Safe'
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

      setSuccessMessage(`Access granted for ${data.user.name}. Entering Haulix Fleet...`)
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
      setErrorMessage('Institutional gate: Email domain must be .edu, .edu.in, or .ac.in')
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

      setSuccessMessage('Institutional credentials verified! Entering...')
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
    <div className="min-h-screen bg-[#0b0c0e] text-[#ffffff] flex flex-col justify-between p-4 sm:p-6 lg:p-10 selection:bg-[#d4e751] selection:text-[#0b0c0e]">
      {/* Top Desktop Navigation Bar */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between pb-6 border-b border-[rgba(255,255,255,0.06)] mb-8">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#d4e751] text-[#0b0c0e] flex items-center justify-center font-black text-xl shadow-lg shadow-[#d4e751]/25">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white leading-none">
                AutoSync
              </span>
              <span className="text-[10px] bg-[#1e2127] text-[#d4e751] font-mono font-extrabold px-2 py-0.5 rounded border border-[#d4e751]/30">
                HAULIX FLEET
              </span>
            </div>
            <p className="text-[10px] font-mono text-[#8e95a0] tracking-widest uppercase mt-1">
              HYPER-LOCAL CAMPUS MOBILITY DISPATCH
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#121417] text-[#22d3ee] border border-[#22d3ee]/25 px-3 py-1.5 rounded-full text-xs font-mono font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#22d3ee] animate-pulse inline-block" />
            <span>.EDU INSTITUTIONAL GATEWAY</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#121417] text-[#d4e751] border border-[#d4e751]/25 px-3 py-1.5 rounded-full text-xs font-mono font-bold shadow-xs">
            <Radio size={13} className="text-[#d4e751] animate-ping" />
            <span>LIVE TRANSIT RADAR</span>
          </div>
        </div>
      </header>

      {/* Main Responsive Grid Layout (Desktop Two-Column) */}
      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center flex-1 my-auto">
        {/* Left Column: Hero, Telemetry & Feature Showcase */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#17191d] border border-[rgba(255,255,255,0.08)] px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-[#d4e751]">
            <Activity size={14} className="text-[#d4e751]" />
            <span className="tracking-wider uppercase">Zero Commission Student Mobility</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
            Metro to Campus,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4e751] via-[#e2f163] to-white">
              Coordinated in Seconds.
            </span>
          </h1>

          <p className="text-[#8e95a0] text-sm sm:text-base leading-relaxed max-w-xl">
            Never commute alone or overpay for auto-rickshaws. AutoSync clusters students heading to campus from Metro stations and Bus depots into shared rides with strict RTO limits, automated UPI splits, and live co-rider safety tracking.
          </p>

          {/* Telemetry Stat Cards Grid */}
          <div className="grid grid-cols-3 gap-3.5 max-w-lg font-mono">
            <div className="bg-[#121417] p-3.5 rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-md">
              <div className="text-[#8e95a0] text-[10px] uppercase font-bold tracking-wider">Cluster Radius</div>
              <div className="text-white text-lg font-black mt-1">300m</div>
              <div className="text-[10px] text-[#22d3ee] mt-0.5">Haversine GPS</div>
            </div>
            <div className="bg-[#121417] p-3.5 rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-md">
              <div className="text-[#8e95a0] text-[10px] uppercase font-bold tracking-wider">RTO Guardrails</div>
              <div className="text-[#d4e751] text-lg font-black mt-1">3 - 4 Pax</div>
              <div className="text-[10px] text-[#8e95a0] mt-0.5">Atomic Limit</div>
            </div>
            <div className="bg-[#121417] p-3.5 rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-md">
              <div className="text-[#8e95a0] text-[10px] uppercase font-bold tracking-wider">Platform Take</div>
              <div className="text-[#10b981] text-lg font-black mt-1">₹0 / Free</div>
              <div className="text-[10px] text-[#10b981] mt-0.5">Direct P2P UPI</div>
            </div>
          </div>

          {/* Feature Highlights Strip */}
          <div className="hidden sm:grid grid-cols-2 gap-3.5 max-w-xl pt-2">
            <div className="bg-[#121417] p-4 rounded-2xl border border-[rgba(255,255,255,0.06)] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1e2127] text-[#d4e751] flex items-center justify-center shrink-0">
                <QrCode size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Dynamic UPI Settlement</h4>
                <p className="text-[11px] text-[#8e95a0] mt-0.5 leading-snug">
                  Generate instant QR codes for GPay, PhonePe & Paytm with equal or proportional distance splits.
                </p>
              </div>
            </div>

            <div className="bg-[#121417] p-4 rounded-2xl border border-[rgba(255,255,255,0.06)] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1e2127] text-[#22d3ee] flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Campus Safety Matrix</h4>
                <p className="text-[11px] text-[#8e95a0] mt-0.5 leading-snug">
                  Vehicle plate verification, Women-Only filter, and 1-tap SOS dial directly to 112 & emergency contact.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Haulix Institutional Auth Terminal */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-[#121417] border border-[rgba(255,255,255,0.1)] rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black relative overflow-hidden">
            {/* Top Electric Lime Radial Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#d4e751]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header in Terminal Card */}
            <div className="flex items-center justify-between mb-5 relative z-10">
              <div>
                <h3 className="text-lg font-black text-white">Student Access Terminal</h3>
                <p className="text-xs font-mono text-[#8e95a0] mt-0.5">Authenticate with college credentials</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#1e2127] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#d4e751]">
                <GraduationCap size={16} />
              </div>
            </div>

            {/* Haulix Segmented Navigation Tabs */}
            <div className="flex bg-[#17191d] p-1 rounded-2xl mb-5 text-xs font-bold border border-[rgba(255,255,255,0.08)] shadow-inner">
              <button
                type="button"
                onClick={() => { setActiveTab('demo'); setErrorMessage(''); }}
                className={`flex-1 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'bg-[#d4e751] text-[#0b0c0e] shadow-md shadow-[#d4e751]/30 font-extrabold'
                    : 'text-[#8e95a0] hover:text-white'
                }`}
              >
                <Sparkles size={14} />
                <span>1-Click Demo</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
                className={`flex-1 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  activeTab === 'login'
                    ? 'bg-[#d4e751] text-[#0b0c0e] shadow-md shadow-[#d4e751]/30 font-extrabold'
                    : 'text-[#8e95a0] hover:text-white'
                }`}
              >
                <span>Login</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
                className={`flex-1 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  activeTab === 'register'
                    ? 'bg-[#d4e751] text-[#0b0c0e] shadow-md shadow-[#d4e751]/30 font-extrabold'
                    : 'text-[#8e95a0] hover:text-white'
                }`}
              >
                <span>Register</span>
              </button>
            </div>

            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="mb-4 p-3.5 bg-[#251214] border border-[#ef4444]/60 text-[#fca5a5] rounded-2xl text-xs flex items-start gap-2.5 shadow-xs">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#ef4444]" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3.5 bg-[#122218] border border-[#10b981]/60 text-[#86efac] rounded-2xl text-xs flex items-center gap-2.5 shadow-xs">
                <CheckCircle2 size={16} className="shrink-0 text-[#10b981]" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {/* 1-CLICK DEMO PERSONAS TAB */}
            {activeTab === 'demo' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-[10px] font-mono font-extrabold text-[#8e95a0] uppercase tracking-wider">
                    Instant Test Personas
                  </span>
                  <span className="text-[10px] text-[#d4e751] font-mono font-bold bg-[#d4e751]/10 px-2 py-0.5 rounded border border-[#d4e751]/20">
                    Pre-Seeded Multi-Rider
                  </span>
                </div>

                {DEMO_PERSONAS.map((p) => (
                  <div
                    key={p.email}
                    onClick={() => !loading && handleDemoLogin(p.index)}
                    className="group relative bg-[#17191d] border border-[rgba(255,255,255,0.08)] hover:border-[#d4e751] p-3.5 sm:p-4 rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#1e2127] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-2xl group-hover:scale-105 transition-transform shadow-inner">
                        {p.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {p.name}
                          </span>
                          <span className="text-[9px] bg-[#1e2127] text-[#d4e751] font-mono font-extrabold px-2 py-0.5 rounded border border-[#d4e751]/30">
                            {p.badge}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8e95a0] mt-0.5 font-medium">
                          {p.role} • <span className="font-mono text-white font-bold">{p.rollId}</span>
                        </div>
                        <div className="text-[10px] text-[#525866] font-mono mt-0.5 flex items-center gap-1.5">
                          <span>UPI:</span>
                          <span className="text-[#8e95a0]">{p.upi}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-9 h-9 rounded-full bg-[#1e2127] group-hover:bg-[#d4e751] group-hover:text-[#0b0c0e] flex items-center justify-center text-[#8e95a0] transition-all shadow-xs shrink-0 ml-2">
                      {loading ? (
                        <Loader2 size={15} className="animate-spin text-[#d4e751] group-hover:text-[#0b0c0e]" />
                      ) : (
                        <ArrowRight size={15} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LOGIN / REGISTER FORM TAB */}
            {(activeTab === 'login' || activeTab === 'register') && (
              <form onSubmit={handleCustomAuth} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#8e95a0] mb-1.5 uppercase font-mono tracking-wider">
                    Institutional Email (.edu, .edu.in, .ac.in)
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu.in"
                    className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#17191d] text-white focus:border-[#d4e751] focus:ring-1 focus:ring-[#d4e751] outline-none transition"
                  />
                </div>

                {activeTab === 'register' && (
                  <>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-bold text-[#8e95a0] mb-1.5 uppercase font-mono">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Aryan Gupta"
                          className="w-full text-xs font-medium px-3.5 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#17191d] text-white focus:border-[#d4e751] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#8e95a0] mb-1.5 uppercase font-mono">
                          Student Roll / ID
                        </label>
                        <input
                          type="text"
                          required
                          value={rollId}
                          onChange={(e) => setRollId(e.target.value)}
                          placeholder="e.g. 21BCS045"
                          className="w-full text-xs font-medium px-3.5 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#17191d] text-white focus:border-[#d4e751] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-bold text-[#8e95a0] mb-1.5 uppercase font-mono">
                          Gender
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as 'FEMALE' | 'MALE' | 'OTHER')}
                          className="w-full text-xs font-medium px-3.5 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#17191d] text-white focus:border-[#d4e751] outline-none"
                        >
                          <option value="FEMALE">Female (Women Pool)</option>
                          <option value="MALE">Male</option>
                          <option value="OTHER">Other / Prefer not to say</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#8e95a0] mb-1.5 uppercase font-mono">
                          College Name
                        </label>
                        <input
                          type="text"
                          value={collegeName}
                          onChange={(e) => setCollegeName(e.target.value)}
                          placeholder="Campus name"
                          className="w-full text-xs font-medium px-3.5 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#17191d] text-white focus:border-[#d4e751] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#8e95a0] mb-1.5 flex items-center justify-between uppercase font-mono">
                        <span>Default UPI ID (for receiving fare)</span>
                        <span className="text-[10px] text-[#525866]">Optional</span>
                      </label>
                      <input
                        type="text"
                        value={defaultUpiId}
                        onChange={(e) => setDefaultUpiId(e.target.value)}
                        placeholder="yourname@okaxis / @okhdfc"
                        className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#17191d] text-white focus:border-[#d4e751] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#8e95a0] mb-1.5 flex items-center justify-between uppercase font-mono">
                        <span>Emergency Contact Phone</span>
                        <span className="text-[10px] text-[#ef4444]">Safety SOS</span>
                      </label>
                      <input
                        type="tel"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#17191d] text-white focus:border-[#d4e751] outline-none"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 btn-haulix-lime text-xs flex items-center justify-center gap-2 uppercase tracking-wider font-extrabold disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-[#0b0c0e]" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={16} />
                      <span>{activeTab === 'register' ? 'Register & Enter Fleet' : 'Verify & Enter AutoSync'}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Regulatory Compliance Footer */}
      <footer className="max-w-7xl mx-auto w-full pt-8 pb-2 border-t border-[rgba(255,255,255,0.06)] mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs font-mono text-[#8e95a0]">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-[#d4e751]" />
            <span className="text-white font-bold">RTO Safety & Zero-Commission Compliance:</span>
            <span>Zero platform fees • Direct student UPI peer cost-sharing • Strict seat limits</span>
          </div>
          <div>
            <span>AutoSync Mobility • Haulix Campus Fleet Engine</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
