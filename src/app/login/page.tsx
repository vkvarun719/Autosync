'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldCheck,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import AutoSyncLogo from '@/components/Logo'

const RVITM_PERSONAS = [
  {
    name: 'Priya Sharma',
    role: 'CSE 3rd Year',
    email: 'rvit22bcs085.rvitm@rvei.edu.in',
    avatar: '👩🏽‍💻',
    index: 0
  },
  {
    name: 'Rahul Verma',
    role: 'ECE 3rd Year',
    email: 'rvit22bec042.rvitm@rvei.edu.in',
    avatar: '👨🏽‍🎓',
    index: 1
  },
  {
    name: 'Ananya Singh',
    role: 'ISE 2nd Year',
    email: 'rvit23bis019.rvitm@rvei.edu.in',
    avatar: '👩🏽‍🔬',
    index: 2
  }
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/dashboard'

  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(600) // 10 minutes

  // Countdown timer for OTP expiry
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 'OTP' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => Math.max(0, prev - 1))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [step, timerSeconds])

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${mins}:${s < 10 ? '0' : ''}${s}`
  }

  // Client validation for RVITM college domain
  const validateEmail = (val: string): boolean => {
    const clean = val.trim().toLowerCase()
    return (
      clean.endsWith('.rvitm@rvei.edu.in') ||
      clean.endsWith('@rvei.edu.in') ||
      clean.endsWith('@rvitm.edu.in') ||
      clean === 'vkvarun719@gmail.com'
    )
  }

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setDevOtpHint(null)

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail) {
      setErrorMessage('Please enter your RVITM email ID.')
      return
    }

    if (!validateEmail(cleanEmail)) {
      setErrorMessage('Please use your official RVITM student email (e.g. rvit25bai050.rvitm@rvei.edu.in).')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-otp',
          email: cleanEmail
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code')
      }

      setStep('OTP')
      setTimerSeconds(600)
      setSuccessMessage(data.message || `6-digit OTP sent to ${cleanEmail}`)
      if (data.devOtp) {
        setDevOtpHint(data.devOtp)
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const cleanOtp = otp.trim()
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP sent to your email.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-otp',
          email: email.trim().toLowerCase(),
          otp: cleanOtp
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired OTP')
      }

      localStorage.setItem('autosync_user', JSON.stringify(data.user))
      setSuccessMessage(`Welcome, ${data.user.name}! Heading to RVITM rides...`)

      setTimeout(() => {
        router.push(redirectPath)
      }, 500)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle Demo Persona Login
  const handleDemoLogin = async (personaIndex: number) => {
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

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
      if (!res.ok) {
        throw new Error(data.error || 'Demo login failed')
      }

      localStorage.setItem('autosync_user', JSON.stringify(data.user))
      setSuccessMessage(`Welcome ${data.user.name}! Connecting to RVITM commute...`)

      setTimeout(() => {
        router.push(redirectPath)
      }, 400)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-[#171a21] border border-[#262b36] rounded-2xl p-6 sm:p-8 shadow-2xl relative">
      {/* College badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-4">
        <ShieldCheck size={14} />
        <span>RVITM Students Only</span>
      </div>

      <h1 className="text-2xl font-bold text-white tracking-tight">Student Login</h1>
      <p className="text-xs text-[#9aa1b2] mt-1 leading-relaxed">
        Enter your official RVITM college email ID to receive a secure 6-digit access code.
      </p>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-3.5 bg-red-950/60 border border-red-500/50 text-red-200 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mt-4 p-3.5 bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
          <span className="font-medium leading-snug">{successMessage}</span>
        </div>
      )}

      {/* Dev OTP Helper */}
      {devOtpHint && (
        <div className="mt-3 p-3 bg-amber-950/50 border border-amber-500/40 text-amber-200 rounded-xl text-xs flex items-center justify-between">
          <span>Dev OTP Code: <strong className="font-mono text-white text-sm tracking-wider">{devOtpHint}</strong></span>
          <button
            type="button"
            onClick={() => setOtp(devOtpHint)}
            className="text-[11px] font-bold text-amber-400 hover:underline px-2 py-1 rounded bg-amber-500/10"
          >
            Auto-fill
          </button>
        </div>
      )}

      {/* STEP 1: Enter RVITM College Email */}
      {step === 'EMAIL' && (
        <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9aa1b2] mb-1.5">
              RVITM College Email ID
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rvit25bai050.rvitm@rvei.edu.in"
                className="w-full text-sm font-medium px-4 py-3 rounded-xl border border-[#262b36] bg-[#0f1115] text-white placeholder-[#555d6e] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono text-xs sm:text-sm"
              />
              <Mail size={16} className="absolute right-3.5 top-3.5 text-[#555d6e]" />
            </div>
            <p className="text-[11px] text-[#717887] mt-1.5">
              Format: <code className="text-emerald-400 font-mono">usn.rvitm@rvei.edu.in</code> (e.g. <span className="text-[#a1a8b8]">rvit25bai050.rvitm@rvei.edu.in</span>)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0f1115] font-bold text-sm flex items-center justify-center gap-2 transition duration-150 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Sending Code...</span>
              </>
            ) : (
              <>
                <span>Send 6-Digit Code</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: Enter 6-Digit OTP */}
      {step === 'OTP' && (
        <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#9aa1b2]">
                6-Digit Verification Code
              </label>
              <span className="text-[11px] font-mono text-emerald-400">
                Expires in {formatTimer(timerSeconds)}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full text-center tracking-widest text-lg font-bold py-3 px-4 rounded-xl border border-[#262b36] bg-[#0f1115] text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono"
              />
              <KeyRound size={16} className="absolute right-3.5 top-3.5 text-[#555d6e]" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0f1115] font-bold text-sm flex items-center justify-center gap-2 transition duration-150 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify & Enter</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setStep('EMAIL')
                setOtp('')
                setErrorMessage('')
              }}
              className="text-[#9aa1b2] hover:text-white transition"
            >
              Change Email
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSendOtp()}
              className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
            >
              <RefreshCw size={12} />
              <span>Resend Code</span>
            </button>
          </div>
        </form>
      )}

      {/* Demo Section */}
      <div className="mt-8 pt-6 border-t border-[#262b36]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#9aa1b2] flex items-center gap-1.5">
            <Sparkles size={13} className="text-emerald-400" />
            <span>Instant Demo Access (RVITM)</span>
          </span>
          <span className="text-[11px] text-[#6b7280]">1-Click</span>
        </div>

        <div className="space-y-2">
          {RVITM_PERSONAS.map((p) => (
            <button
              key={p.name}
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin(p.index)}
              className="w-full text-left p-3 rounded-xl border border-[#262b36] hover:border-emerald-500/50 bg-[#12141a] hover:bg-[#1a1f29] transition duration-150 flex items-center justify-between group disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{p.avatar}</span>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-[#848b9c]">
                    {p.role} • {p.email}
                  </div>
                </div>
              </div>
              <ChevronRight size={15} className="text-[#555d6e] group-hover:text-emerald-400 transition" />
            </button>
          ))}
        </div>
      </div>

      {/* Back to Home */}
      <div className="mt-6 text-center">
        <Link href="/" className="text-xs text-[#848b9c] hover:text-white transition">
          ← Back to AutoSync Homepage
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-[#f1f3f7] flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-[#0f1115]">
      <header className="mb-8">
        <Link href="/">
          <AutoSyncLogo size={36} />
        </Link>
      </header>

      <Suspense fallback={<div className="text-xs text-[#9aa1b2]">Loading login portal...</div>}>
        <LoginForm />
      </Suspense>

      <footer className="mt-8 text-center text-xs text-[#555d6e]">
        RVITM Campus Commute Utility • Strict College Email Authentication
      </footer>
    </div>
  )
}
