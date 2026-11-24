'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  Users,
  Clock,
  Car,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Copy,
  CheckCircle2,
  ChevronLeft,
  Crown,
  Share2,
  PhoneCall,
  QrCode,
  Check,
  Loader2,
  MessageSquare,
  DollarSign,
  Send,
  UserPlus,
  RefreshCw,
  Info
} from 'lucide-react'
import type { Pool, User } from '@/types'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-40 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
      Loading route map...
    </div>
  ),
})

const UpiQrCode = dynamic(() => import('@/components/UpiQrCode'), {
  ssr: false,
})

const QUICK_STATUS_OPTIONS = [
  'At Gate 2',
  'Spotted an auto',
  '2 mins away',
  'Boarded auto',
  'At Campus Gate'
]

export default function PoolWaitingRoomPage() {
  const router = useRouter()
  const params = useParams()
  const poolId = params?.id as string

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [pool, setPool] = useState<Pool | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [simulating, setSimulating] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  // Status updates
  const [myStatus, setMyStatus] = useState('')
  const [sendingStatus, setSendingStatus] = useState(false)

  // Fare settlement states (Ride Lead)
  const [fareInput, setFareInput] = useState('')
  const [splitMode, setSplitMode] = useState<'EQUAL' | 'PROPORTIONAL'>('EQUAL')
  const [settling, setSettling] = useState(false)
  const [selectedRiderForQr, setSelectedRiderForQr] = useState<string | null>(null)

  // Safety & Vehicle Plate
  const [plateInput, setPlateInput] = useState('')
  const [savingPlate, setSavingPlate] = useState(false)
  const [sosModalOpen, setSosModalOpen] = useState(false)

  // Polling ref
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 1. Fetch current student user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('autosync_user')
    if (!userStr) {
      router.push('/')
      return
    }
    try {
      setCurrentUser(JSON.parse(userStr))
    } catch {
      router.push('/')
    }
  }, [router])

  // 2. Fetch pool data
  const fetchPoolData = useCallback(async () => {
    if (!poolId) return
    try {
      const res = await fetch(`/api/pools/${poolId}`)
      const data = await res.json()
      if (res.ok && data.pool) {
        setPool(data.pool)
        if (data.pool.vehicleNumber) {
          setPlateInput(data.pool.vehicleNumber)
        }
      } else {
        setErrorMsg(data.error || 'Pool not found')
      }
    } catch (err) {
      console.error('Failed to poll pool:', err)
    } finally {
      setLoading(false)
    }
  }, [poolId])

  // 3. Live polling every 3 seconds
  useEffect(() => {
    fetchPoolData()
    pollTimerRef.current = setInterval(fetchPoolData, 3000)
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [fetchPoolData])

  // Countdown calculation
  const [timeLeft, setTimeLeft] = useState('')
  useEffect(() => {
    if (!pool?.expiresAt) return

    const tick = () => {
      const diff = new Date(pool.expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('Window Expired')
        return
      }
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`)
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [pool?.expiresAt])

  // Simulate another student joining
  const handleSimulateRider = async () => {
    if (!poolId || simulating) return
    setSimulating(true)
    try {
      const res = await fetch(`/api/pools/${poolId}/simulate-rider`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not simulate rider')
      await fetchPoolData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Simulation failed')
    } finally {
      setSimulating(false)
    }
  }

  // Quick Status change
  const handleSendQuickStatus = async (statusText: string) => {
    if (!currentUser || !poolId) return
    setSendingStatus(true)
    setMyStatus(statusText)
    try {
      await fetch(`/api/pools/${poolId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          message: statusText,
        }),
      })
      await fetchPoolData()
    } finally {
      setSendingStatus(false)
    }
  }

  // Save Vehicle Number Plate
  const handleSavePlate = async () => {
    if (!plateInput.trim() || !poolId) return
    setSavingPlate(true)
    try {
      await fetch(`/api/pools/${poolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleNumber: plateInput.trim() }),
      })
      await fetchPoolData()
    } finally {
      setSavingPlate(false)
    }
  }

  // Calculate & Settle Fare (Ride Lead)
  const handleCalculateFare = async () => {
    const total = parseFloat(fareInput)
    if (isNaN(total) || total <= 0 || !poolId) {
      alert('Please enter a valid total fare amount (e.g. 90 or 120)')
      return
    }

    setSettling(true)
    try {
      const res = await fetch(`/api/pools/${poolId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalFare: total,
          splitType: splitMode,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to settle fare')
      await fetchPoolData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Fare calculation failed')
    } finally {
      setSettling(false)
    }
  }

  // Mark rider as paid
  const handleMarkPaid = async (targetUserId: string) => {
    if (!poolId) return
    try {
      await fetch(`/api/pools/${poolId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId }),
      })
      await fetchPoolData()
    } catch (err) {
      console.error(err)
    }
  }

  // Transfer Leadership
  const handleTransferLead = async (newLeadId: string) => {
    if (!poolId) return
    try {
      await fetch(`/api/pools/${poolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: newLeadId }),
      })
      await fetchPoolData()
    } catch (err) {
      console.error(err)
    }
  }

  // 1-Tap SOS
  const handleTriggerSOS = async () => {
    if (!poolId) return
    setSosModalOpen(true)
    try {
      await fetch(`/api/pools/${poolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sosTriggered: true }),
      })
      await fetchPoolData()
    } catch (err) {
      console.error(err)
    }
  }

  // Copy Live Trip Share Link
  const handleCopyTripShare = () => {
    if (!pool) return
    const ridersList = pool.members.map((m) => m.user.name).join(', ')
    const shareText = `🚨 AutoSync Live Commute Share\n📍 Route: ${pool.hub.name} ➡️ ${pool.destination.name}\n🛺 Vehicle: ${pool.vehicleType} ${pool.vehicleNumber ? `[${pool.vehicleNumber}]` : '(Not yet registered)'}\n👥 Students: ${ridersList}\n🔗 Live Link: ${window.location.href}`

    navigator.clipboard.writeText(shareText)
    setCopyFeedback('Live Trip Share text copied to clipboard!')
    setTimeout(() => setCopyFeedback(null), 3000)
  }

  const isRideLead = currentUser?.id === pool?.leadId
  const leadUpi = pool?.lead?.defaultUpiId || 'campus.autosync@okaxis'
  const leadName = pool?.lead?.name || 'Ride Lead'

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 size={32} className="animate-spin text-indigo-600 mb-3" />
        <p className="text-xs font-semibold">Joining AutoSync Waiting Room...</p>
      </div>
    )
  }

  if (!pool) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-700">
        <p className="text-sm font-bold text-rose-600 mb-2">{errorMsg || 'Pool not found'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-xs text-indigo-600 underline"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  const seatsOccupied = pool.members.length
  const isFull = pool.seatsAvailable <= 0

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-8">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-xs flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-xs font-bold"
        >
          <ChevronLeft size={16} />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isFull
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isFull ? 'POOL READY' : `${pool.seatsAvailable} SEAT LEFT`}
          </span>

          <button
            onClick={fetchPoolData}
            title="Refresh now"
            className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* SOS Alert Banner (if active) */}
      {(pool.sosTriggered || sosModalOpen) && (
        <div className="bg-rose-600 text-white p-3 px-4 flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2 font-bold">
            <ShieldAlert size={16} />
            <span>EMERGENCY SOS IS ACTIVE FOR THIS RIDE</span>
          </div>
          <button
            onClick={() => setSosModalOpen(true)}
            className="bg-white text-rose-700 px-2.5 py-1 rounded-lg font-bold text-[10px]"
          >
            View Details
          </button>
        </div>
      )}

      {/* Route & Vehicle Summary Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-900 text-white p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] tracking-wider uppercase font-semibold text-indigo-200">
            {pool.vehicleType === 'AUTO' ? '🛺 Auto-Rickshaw Pool' : '🚕 Cab Pool'}
          </span>
          <div className="flex items-center gap-1 text-[11px] font-mono bg-white/10 px-2 py-0.5 rounded-full">
            <Clock size={11} className="text-yellow-300" />
            <span>{timeLeft}</span>
          </div>
        </div>

        <h1 className="text-base font-extrabold leading-snug">
          {pool.hub.name}
        </h1>
        <div className="flex items-center gap-1.5 text-xs text-indigo-200 mt-0.5">
          <span>Drop-off:</span>
          <span className="text-white font-bold">{pool.destination.name}</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] bg-black/20 backdrop-blur-xs p-2 rounded-xl">
          <span className="flex items-center gap-1">
            <Users size={13} />
            <span>Capacity: <strong>{seatsOccupied}/{pool.maxSeats} Riders</strong></span>
          </span>
          {pool.womenOnly && (
            <span className="flex items-center gap-1 text-pink-300 font-semibold">
              <Shield size={12} /> Women-Only
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Route Map */}
        <div className="h-36 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
          <MapView
            hubs={[pool.hub]}
            destinations={[pool.destination]}
            selectedHub={pool.hub}
            selectedDest={pool.destination}
          />
        </div>

        {/* 1. Co-Riders & Seat Capacity Slots */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Users size={14} className="text-indigo-600" />
              <span>Co-Riders in Pool ({seatsOccupied}/{pool.maxSeats})</span>
            </div>
            <span className="text-[10px] text-slate-400">
              Auto-polls every 3s
            </span>
          </div>

          <div className="space-y-2">
            {pool.members.map((member) => {
              const isLead = member.userId === pool.leadId
              const isMe = member.userId === currentUser?.id
              const isPaid = member.status === 'PAID'

              return (
                <div
                  key={member.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition ${
                    isMe
                      ? 'border-indigo-300 bg-indigo-50/50'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                        member.user.gender === 'FEMALE'
                          ? 'bg-pink-100 text-pink-700 border border-pink-200'
                          : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {member.user.gender === 'FEMALE' ? '👩🏽' : '👨🏽'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">
                          {member.user.name}
                        </span>
                        {isMe && (
                          <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold">
                            You
                          </span>
                        )}
                        {isLead && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                            <Crown size={9} /> Lead
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {member.user.rollId} • {member.user.collegeName || 'DTU'}
                      </div>
                      {member.quickStatus && (
                        <div className="text-[10px] font-medium text-indigo-600 mt-0.5 flex items-center gap-1">
                          <MessageSquare size={10} />
                          <span>&quot;{member.quickStatus}&quot;</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {member.shareAmt ? (
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          ₹{member.shareAmt}
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isPaid ? '✓ Paid' : 'Pending'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">
                        Joined
                      </span>
                    )}

                    {/* Lead transfer action */}
                    {isRideLead && !isLead && (
                      <button
                        onClick={() => handleTransferLead(member.userId)}
                        className="block text-[9px] text-indigo-600 hover:underline mt-1"
                      >
                        Make Lead
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Empty seat placeholders */}
            {Array.from({ length: pool.seatsAvailable }).map((_, i) => (
              <div
                key={`empty-seat-${i}`}
                className="p-3 rounded-xl border border-dashed border-slate-200 bg-white flex items-center justify-between text-slate-400"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-xs">
                    🪑
                  </div>
                  <div>
                    <div className="text-xs font-medium">Empty Seat #{seatsOccupied + i + 1}</div>
                    <div className="text-[10px]">Waiting for matching student...</div>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  Available
                </span>
              </div>
            ))}
          </div>

          {/* Simulate Student Button (Single-tester testing) */}
          {!isFull && (
            <button
              onClick={handleSimulateRider}
              disabled={simulating}
              className="mt-3 w-full py-2.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Simulating Co-Rider Joining...</span>
                </>
              ) : (
                <>
                  <UserPlus size={13} />
                  <span>Simulate Another Student Joining (Instant Solo Test)</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* 2. Quick Status Chips */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <MessageSquare size={13} className="text-indigo-600" />
            <span>Update Your Live Status</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_STATUS_OPTIONS.map((statusOption) => (
              <button
                key={statusOption}
                onClick={() => handleSendQuickStatus(statusOption)}
                disabled={sendingStatus}
                className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all ${
                  myStatus === statusOption
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-white'
                }`}
              >
                {statusOption}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Proportional Fare Splitting & Automated UPI Links */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <DollarSign size={14} className="text-emerald-600" />
              <span>Fare Splitting & UPI Deep Link</span>
            </div>
            {isRideLead && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Crown size={10} /> You are Ride Lead
              </span>
            )}
          </div>

          {/* Ride Lead Fare Input & Split Mode */}
          {isRideLead && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Total Driver Fare (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={fareInput}
                    onChange={(e) => setFareInput(e.target.value)}
                    placeholder="e.g. 90"
                    className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Split Method
                  </label>
                  <select
                    value={splitMode}
                    onChange={(e) => setSplitMode(e.target.value as 'EQUAL' | 'PROPORTIONAL')}
                    className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="EQUAL">Equal Split</option>
                    <option value="PROPORTIONAL">Proportional (Distance)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCalculateFare}
                disabled={settling}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {settling ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <>
                    <Check size={13} />
                    <span>Calculate & Generate Dynamic UPI QRs</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Generated UPI Splits & QR Codes */}
          {pool.totalFare ? (
            <div className="space-y-3 pt-1">
              <div className="text-[11px] text-slate-600 flex items-center justify-between bg-emerald-50/70 border border-emerald-200 p-2 rounded-lg">
                <span>Total Fare: <strong>₹{pool.totalFare}</strong> ({pool.splitType})</span>
                <span className="text-[10px] text-emerald-800 font-mono">Lead: {leadUpi}</span>
              </div>

              <div className="space-y-2.5">
                {pool.members.map((member) => {
                  const share = member.shareAmt || (pool.totalFare ? Math.round((pool.totalFare / pool.members.length) * 100) / 100 : 0)
                  const isLead = member.userId === pool.leadId
                  const isPaid = member.status === 'PAID'
                  const isCurrentRider = member.userId === currentUser?.id

                  // Generate UPI Deep Link
                  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(leadUpi)}&pn=${encodeURIComponent(leadName)}&am=${share.toFixed(2)}&cu=INR&tn=AutoSync_${pool.id}`

                  return (
                    <div
                      key={`share-${member.id}`}
                      className="p-3 bg-white border border-slate-200 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span>{member.user.name}</span>
                            {isLead && <span className="text-[9px] text-amber-600 font-bold">(Collects)</span>}
                          </div>
                          <div className="text-sm font-extrabold text-indigo-700">
                            ₹{share.toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isPaid ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                              <CheckCircle2 size={11} /> Paid
                            </span>
                          ) : (
                            isRideLead && !isLead && (
                              <button
                                onClick={() => handleMarkPaid(member.userId)}
                                className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg transition"
                              >
                                Mark as Paid
                              </button>
                            )
                          )}

                          {!isLead && (
                            <button
                              onClick={() =>
                                setSelectedRiderForQr(selectedRiderForQr === member.id ? null : member.id)
                              }
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg font-bold flex items-center gap-1"
                            >
                              <QrCode size={12} />
                              <span>{selectedRiderForQr === member.id ? 'Hide QR' : 'Show QR'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable UPI QR Code & Link */}
                      {!isLead && (selectedRiderForQr === member.id || isCurrentRider) && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col items-center gap-2">
                          <UpiQrCode value={upiDeepLink} size={120} />
                          <div className="text-[10px] text-slate-500 font-mono text-center">
                            Scan with GPay, PhonePe, Paytm, or BHIM
                          </div>

                          <div className="w-full flex gap-1.5">
                            <a
                              href={upiDeepLink}
                              className="flex-1 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg text-center hover:bg-indigo-700"
                            >
                              Open in UPI App
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(upiDeepLink)
                                setCopyFeedback('UPI Deep Link copied!')
                                setTimeout(() => setCopyFeedback(null), 2000)
                              }}
                              className="px-2 py-1.5 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-50 flex items-center gap-1"
                            >
                              <Copy size={11} /> Copy Link
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
              {isRideLead
                ? 'Enter the driver fare above to automatically compute individual shares & UPI QR codes.'
                : 'Waiting for Ride Lead to enter driver fare...'}
            </div>
          )}
        </div>

        {/* 4. Safety & RTO Compliance Layer */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Shield size={14} className="text-indigo-600" />
            <span>Active Ride Safety Bar</span>
          </div>

          {/* Vehicle Number Plate input/logger */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              Vehicle Registration Plate
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={plateInput}
                onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
                placeholder="e.g. DL 1R AB 4589"
                className="flex-1 text-xs font-mono font-bold tracking-wider px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none uppercase"
              />
              <button
                onClick={handleSavePlate}
                disabled={savingPlate || !plateInput.trim()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
              >
                {savingPlate ? <Loader2 size={13} className="animate-spin" /> : 'Log Plate'}
              </button>
            </div>
          </div>

          {/* Action buttons: Trip Share + 1-Tap SOS */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleCopyTripShare}
              className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Share2 size={13} className="text-indigo-600" />
              <span>Copy Live Trip Share</span>
            </button>

            <button
              onClick={handleTriggerSOS}
              className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm shadow-rose-200 transition"
            >
              <ShieldAlert size={14} />
              <span>1-Tap SOS Trigger</span>
            </button>
          </div>

          {copyFeedback && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs text-center font-medium">
              {copyFeedback}
            </div>
          )}

          {/* RTO Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 leading-relaxed flex items-start gap-1.5">
            <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>RTO Compliance Notice:</strong> AutoSync is a zero-commission peer-to-peer student carpooling utility. No commercial ride-hailing fees are charged.
            </span>
          </div>
        </div>
      </div>

      {/* SOS MODAL */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-rose-200">
            <div className="flex items-center gap-2 text-rose-600 font-extrabold text-base">
              <ShieldAlert size={20} />
              <span>Emergency SOS Protocol</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Live ride details have been flagged. Connect immediately to police or campus security:
            </p>

            <div className="space-y-2">
              <a
                href="tel:112"
                className="w-full py-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-200"
              >
                <PhoneCall size={14} />
                <span>Call Police / Emergency 112</span>
              </a>

              {currentUser?.emergencyContact && (
                <a
                  href={`tel:${currentUser.emergencyContact}`}
                  className="w-full py-2.5 border border-slate-300 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50"
                >
                  <PhoneCall size={14} className="text-indigo-600" />
                  <span>Call Emergency Contact ({currentUser.emergencyContact})</span>
                </a>
              )}
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[10px] font-mono space-y-0.5 text-slate-600">
              <div>Pool ID: {pool.id}</div>
              <div>Route: {pool.hub.name} → {pool.destination.name}</div>
              <div>Vehicle: {pool.vehicleNumber || 'Unregistered'}</div>
              <div>Riders: {pool.members.map((m) => m.user.name).join(', ')}</div>
            </div>

            <button
              onClick={() => setSosModalOpen(false)}
              className="w-full py-2 text-xs text-slate-500 font-semibold text-center hover:text-slate-800"
            >
              Dismiss Window
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
