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
  Info,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Activity,
  Layers
} from 'lucide-react'
import type { Pool, User } from '@/types'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-36 bg-[#15171b] rounded-2xl flex items-center justify-center text-[#8e95a0] text-xs font-mono">
      Loading dark route telemetry...
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-[#8e95a0] bg-[#121417]">
        <Loader2 size={32} className="animate-spin text-[#d4e751] mb-3" />
        <p className="text-xs font-mono font-bold text-white">CONNECTING TO HAULIX DISPATCH ROOM...</p>
        <p className="text-[10px] text-[#525866] font-mono mt-1">Syncing real-time co-rider status</p>
      </div>
    )
  }

  if (!pool) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-300 bg-[#121417]">
        <div className="w-12 h-12 rounded-2xl bg-[#251214] text-[#f87171] flex items-center justify-center mb-3 border border-[#ef4444]/50">
          <AlertTriangle size={20} />
        </div>
        <p className="text-sm font-bold text-white mb-1">{errorMsg || 'Pool not found'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-xs text-[#d4e751] font-mono font-bold underline mt-2"
        >
          Return to Commuter Dashboard
        </button>
      </div>
    )
  }

  const seatsOccupied = pool.members.length
  const isFull = pool.seatsAvailable <= 0

  return (
    <div className="flex-1 flex flex-col bg-[#121417] text-[#ffffff] pb-10">
      {/* Top Header */}
      <div className="bg-[#17191d]/95 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)] px-4 py-3 sticky top-0 z-30 shadow-md flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-[#8e95a0] hover:text-white flex items-center gap-1 text-xs font-mono font-bold transition"
        >
          <ChevronLeft size={16} />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <span
            className={`text-[9px] font-mono font-extrabold px-2.5 py-0.5 rounded tracking-wide uppercase ${
              isFull
                ? 'bg-[#122218] text-[#10b981] border border-[#10b981]/50'
                : 'bg-[#1e231b] text-[#d4e751] border border-[#d4e751]/50'
            }`}
          >
            {isFull ? 'CONVOY READY' : `${pool.seatsAvailable} SEAT${pool.seatsAvailable > 1 ? 'S' : ''} LEFT`}
          </span>

          <button
            onClick={fetchPoolData}
            title="Refresh now"
            className="w-7 h-7 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1e2127] flex items-center justify-center text-[#8e95a0] hover:text-[#d4e751] transition shadow-xs"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* SOS Alert Banner */}
      {(pool.sosTriggered || sosModalOpen) && (
        <div className="bg-[#ef4444] text-white p-3.5 px-4 flex items-center justify-between text-xs animate-pulse shadow-md font-mono">
          <div className="flex items-center gap-2 font-bold">
            <ShieldAlert size={18} />
            <span>EMERGENCY SOS ACTIVE FOR THIS RIDE</span>
          </div>
          <button
            onClick={() => setSosModalOpen(true)}
            className="bg-white text-[#ef4444] px-3 py-1 rounded-xl font-bold text-[10px] shadow-sm uppercase"
          >
            Details
          </button>
        </div>
      )}

      {/* Haulix Dark Fleet Dispatch Banner */}
      <div className="bg-[#17191d] text-white p-5 border-b border-[rgba(255,255,255,0.08)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#d4e751]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-widest uppercase font-extrabold text-[#d4e751] flex items-center gap-1.5">
              <span>{pool.vehicleType === 'AUTO' ? '🛺 Auto Pod' : '🚕 Cab Convoy'}</span>
              <span>•</span>
              <span>Max {pool.maxSeats}</span>
            </span>

            <div className="flex items-center gap-1.5 text-[11px] font-mono bg-[#1e2127] px-2.5 py-1 rounded-full border border-[rgba(255,255,255,0.08)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4e751] animate-ping inline-block" />
              <span className="text-white font-bold">{timeLeft}</span>
            </div>
          </div>

          <h1 className="text-lg font-black tracking-tight text-white mb-0.5">
            {pool.hub.name}
          </h1>

          <div className="flex items-center gap-1.5 text-xs text-[#8e95a0] font-mono">
            <span>Destination:</span>
            <span className="text-[#d4e751] font-bold">{pool.destination.name}</span>
          </div>

          <div className="mt-3.5 pt-3 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-[11px] font-mono text-[#8e95a0]">
            <span className="flex items-center gap-1.5">
              <Users size={13} className="text-[#d4e751]" />
              <span>Co-Riders: <strong className="text-white">{seatsOccupied}/{pool.maxSeats}</strong></span>
            </span>
            {pool.womenOnly && (
              <span className="flex items-center gap-1 text-pink-400 font-bold bg-[#25131f] px-2 py-0.5 rounded border border-pink-500/30">
                <Shield size={11} /> Women-Only
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Dark Route Telemetry Map */}
        <div className="h-40 rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] shadow-md">
          <MapView
            hubs={[pool.hub]}
            destinations={[pool.destination]}
            selectedHub={pool.hub}
            selectedDest={pool.destination}
          />
        </div>

        {/* 1. Co-Riders & Seat Allocation */}
        <div className="bg-[#17191d] rounded-3xl p-5 border border-[rgba(255,255,255,0.08)] shadow-xl">
          <div className="flex items-center justify-between mb-3.5">
            <div className="text-xs font-black text-white flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#1e2127] text-[#d4e751] flex items-center justify-center font-bold">
                <Users size={13} />
              </div>
              <span>Co-Riders in Pool ({seatsOccupied}/{pool.maxSeats})</span>
            </div>
            <span className="text-[10px] font-mono text-[#8e95a0]">
              3s live poll
            </span>
          </div>

          <div className="space-y-2.5">
            {pool.members.map((member) => {
              const isLead = member.userId === pool.leadId
              const isMe = member.userId === currentUser?.id
              const isPaid = member.status === 'PAID'

              return (
                <div
                  key={member.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all duration-200 ${
                    isMe
                      ? 'border-[#d4e751] bg-[#1e2127] shadow-md'
                      : 'border-[rgba(255,255,255,0.08)] bg-[#17191d] hover:border-[rgba(255,255,255,0.18)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base shadow-inner ${
                        member.user.gender === 'FEMALE'
                          ? 'bg-[#25131f] text-pink-300 border border-pink-500/30'
                          : 'bg-[#18202d] text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {member.user.gender === 'FEMALE' ? '👩🏽' : '👨🏽'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">
                          {member.user.name}
                        </span>
                        {isMe && (
                          <span className="text-[9px] bg-[#d4e751] text-[#0b0c0e] px-1.5 py-0.2 rounded font-mono font-extrabold tracking-wide">
                            YOU
                          </span>
                        )}
                        {isLead && (
                          <span className="text-[9px] bg-[#1e231b] text-[#d4e751] border border-[#d4e751]/30 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-0.5">
                            <Crown size={9} /> LEAD
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#8e95a0] font-mono mt-0.5">
                        {member.user.rollId} • {member.user.collegeName || 'DTU'}
                      </div>
                      {member.quickStatus && (
                        <div className="text-[10px] font-mono text-[#d4e751] mt-0.5 flex items-center gap-1">
                          <MessageSquare size={10} />
                          <span>&quot;{member.quickStatus}&quot;</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    {member.shareAmt ? (
                      <div>
                        <div className="text-xs font-black text-white">
                          ₹{member.shareAmt}
                        </div>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                            isPaid
                              ? 'bg-[#122218] text-[#10b981] border border-[#10b981]/50'
                              : 'bg-[#1e231b] text-[#d4e751] border border-[#d4e751]/50'
                          }`}
                        >
                          {isPaid ? 'PAID' : 'PENDING'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] bg-[#1e2127] text-[#8e95a0] px-2 py-0.5 rounded font-bold border border-[rgba(255,255,255,0.08)]">
                        JOINED
                      </span>
                    )}

                    {isRideLead && !isLead && (
                      <button
                        onClick={() => handleTransferLead(member.userId)}
                        className="block text-[9px] text-[#d4e751] hover:underline font-bold mt-1 uppercase"
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
                className="p-3.5 rounded-2xl border border-dashed border-[rgba(255,255,255,0.08)] bg-[#121417]/50 flex items-center justify-between text-[#525866]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl border border-dashed border-[rgba(255,255,255,0.08)] flex items-center justify-center text-sm bg-[#17191d]">
                    🪑
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#8e95a0] font-mono">AVAILABLE SEAT #{seatsOccupied + i + 1}</div>
                    <div className="text-[10px] text-[#525866]">Waiting for matching student...</div>
                  </div>
                </div>
                <span className="text-[9px] bg-[#1e2127] text-[#8e95a0] border border-[rgba(255,255,255,0.08)] px-2.5 py-1 rounded font-mono font-bold">
                  OPEN
                </span>
              </div>
            ))}
          </div>

          {/* Simulate Student Button */}
          {!isFull && (
            <button
              onClick={handleSimulateRider}
              disabled={simulating}
              className="mt-3.5 w-full py-3 rounded-2xl border border-dashed border-[#d4e751]/40 bg-[#1e231b]/60 hover:bg-[#1e231b] text-[#d4e751] text-xs font-mono font-bold flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <Loader2 size={14} className="animate-spin text-[#d4e751]" />
                  <span>SIMULATING COMMUTER JOINING...</span>
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>SIMULATE ANOTHER STUDENT (SOLO TEST)</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* 2. Quick Status Chips */}
        <div className="bg-[#17191d] rounded-3xl p-5 border border-[rgba(255,255,255,0.08)] shadow-xl">
          <div className="text-xs font-black text-white mb-2.5 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#1e2127] text-[#d4e751] flex items-center justify-center font-bold">
              <MessageSquare size={13} />
            </div>
            <span>Update Your Quick Status</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_STATUS_OPTIONS.map((statusOption) => (
              <button
                key={statusOption}
                onClick={() => handleSendQuickStatus(statusOption)}
                disabled={sendingStatus}
                className={`text-[11px] font-mono font-bold px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  myStatus === statusOption
                    ? 'border-[#d4e751] bg-[#d4e751] text-[#0b0c0e] shadow-md'
                    : 'border-[rgba(255,255,255,0.08)] bg-[#1e2127] text-[#8e95a0] hover:border-[#d4e751]/60 hover:text-white'
                }`}
              >
                {statusOption}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Proportional Fare Splitting & Automated UPI Links */}
        <div className="bg-[#17191d] rounded-3xl p-5 border border-[rgba(255,255,255,0.08)] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
            <div className="text-xs font-black text-white flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#122218] text-[#10b981] flex items-center justify-center font-bold">
                <DollarSign size={13} />
              </div>
              <span>Fare Settlement & UPI Dispatch</span>
            </div>
            {isRideLead && (
              <span className="text-[9px] font-mono font-extrabold text-[#d4e751] bg-[#1e231b] border border-[#d4e751]/30 px-2 py-0.5 rounded flex items-center gap-1">
                <Crown size={10} /> LEAD DISPATCHER
              </span>
            )}
          </div>

          {/* Ride Lead Input & Split Calculator */}
          {isRideLead && (
            <div className="p-4 bg-[#1e2127] rounded-2xl border border-[rgba(255,255,255,0.06)] space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono font-extrabold text-[#8e95a0] uppercase mb-1">
                    Total Fare (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={fareInput}
                    onChange={(e) => setFareInput(e.target.value)}
                    placeholder="e.g. 90"
                    className="w-full text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#17191d] text-white focus:border-[#d4e751] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-extrabold text-[#8e95a0] uppercase mb-1">
                    Split Method
                  </label>
                  <select
                    value={splitMode}
                    onChange={(e) => setSplitMode(e.target.value as 'EQUAL' | 'PROPORTIONAL')}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#17191d] text-white focus:border-[#d4e751] outline-none transition"
                  >
                    <option value="EQUAL">Equal Split</option>
                    <option value="PROPORTIONAL">Proportional (Distance)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCalculateFare}
                disabled={settling}
                className="w-full py-2.5 btn-haulix-lime text-xs flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider font-extrabold disabled:opacity-50"
              >
                {settling ? (
                  <Loader2 size={14} className="animate-spin text-[#0b0c0e]" />
                ) : (
                  <>
                    <Check size={14} />
                    <span>Generate Dynamic UPI QRs</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Render Splits and Dynamic UPI QRs */}
          {pool.totalFare ? (
            <div className="space-y-3 pt-1">
              <div className="text-[11px] text-[#8e95a0] font-mono flex items-center justify-between bg-[#1e2127] border border-[rgba(255,255,255,0.08)] p-2.5 rounded-xl">
                <span>Total Fare: <strong className="text-white">₹{pool.totalFare}</strong> ({pool.splitType})</span>
                <span className="text-[10px] text-[#d4e751] font-bold">UPI: {leadUpi}</span>
              </div>

              <div className="space-y-3">
                {pool.members.map((member) => {
                  const share = member.shareAmt || (pool.totalFare ? Math.round((pool.totalFare / pool.members.length) * 100) / 100 : 0)
                  const isLead = member.userId === pool.leadId
                  const isPaid = member.status === 'PAID'
                  const isCurrentRider = member.userId === currentUser?.id

                  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(leadUpi)}&pn=${encodeURIComponent(leadName)}&am=${share.toFixed(2)}&cu=INR&tn=AutoSync_${pool.id}`

                  return (
                    <div
                      key={`share-${member.id}`}
                      className="p-3.5 bg-[#17191d] border border-[rgba(255,255,255,0.08)] rounded-2xl space-y-2.5 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{member.user.name}</span>
                            {isLead && <span className="text-[9px] text-[#d4e751] font-mono font-bold">(Collects)</span>}
                          </div>
                          <div className="text-sm font-mono font-black text-[#d4e751]">
                            ₹{share.toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isPaid ? (
                            <span className="text-[9px] bg-[#122218] text-[#10b981] border border-[#10b981]/50 px-2.5 py-1 rounded font-mono font-bold flex items-center gap-1">
                              <CheckCircle2 size={11} /> PAID
                            </span>
                          ) : (
                            isRideLead && !isLead && (
                              <button
                                onClick={() => handleMarkPaid(member.userId)}
                                className="text-[10px] bg-[#10b981] hover:bg-[#059669] text-[#0b0c0e] font-mono font-bold px-3 py-1.5 rounded-xl transition shadow-xs uppercase"
                              >
                                Mark Paid
                              </button>
                            )
                          )}

                          {!isLead && (
                            <button
                              onClick={() =>
                                setSelectedRiderForQr(selectedRiderForQr === member.id ? null : member.id)
                              }
                              className="text-[10px] bg-[#1e2127] hover:bg-[#252830] text-white px-2.5 py-1.5 rounded-xl font-mono font-bold flex items-center gap-1 transition border border-[rgba(255,255,255,0.08)]"
                            >
                              <QrCode size={12} />
                              <span>{selectedRiderForQr === member.id ? 'Hide' : 'QR Code'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Luxury White UPI QR Container */}
                      {!isLead && (selectedRiderForQr === member.id || isCurrentRider) && (
                        <div className="mt-2 pt-3 border-t border-[rgba(255,255,255,0.08)] flex flex-col items-center gap-2.5 bg-[#14161a] p-3.5 rounded-2xl border border-[rgba(255,255,255,0.06)]">
                          <UpiQrCode value={upiDeepLink} size={130} />
                          <div className="text-[10px] text-[#8e95a0] font-mono text-center">
                            Scan with GPay, PhonePe, Paytm, or BHIM
                          </div>

                          <div className="w-full flex gap-2">
                            <a
                              href={upiDeepLink}
                              className="flex-1 py-2 btn-haulix-lime text-[#0b0c0e] text-[11px] font-mono font-bold rounded-xl text-center shadow-xs transition"
                            >
                              Open in UPI App
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(upiDeepLink)
                                setCopyFeedback('UPI Deep Link copied!')
                                setTimeout(() => setCopyFeedback(null), 2000)
                              }}
                              className="px-3 py-2 border border-[rgba(255,255,255,0.08)] bg-[#1e2127] text-white text-[11px] font-mono font-bold rounded-xl hover:bg-[#252830] flex items-center gap-1 shadow-2xs transition"
                            >
                              <Copy size={12} />
                              <span>Copy</span>
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
            <div className="p-4 bg-[#1e2127] rounded-2xl text-center text-[#525866] text-xs font-mono">
              {isRideLead
                ? 'Enter the driver fare above to automatically compute individual shares & UPI QR codes.'
                : 'Waiting for Ride Lead to enter driver fare...'}
            </div>
          )}
        </div>

        {/* 4. Safety & RTO Compliance Layer */}
        <div className="bg-[#17191d] rounded-3xl p-5 border border-[rgba(255,255,255,0.08)] shadow-xl space-y-3.5">
          <div className="text-xs font-black text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#251214] text-[#ef4444] flex items-center justify-center font-bold">
              <Shield size={13} />
            </div>
            <span>Active Ride Safety Bar</span>
          </div>

          {/* Vehicle Number Plate logger */}
          <div>
            <label className="block text-[10px] font-mono font-extrabold text-[#8e95a0] uppercase mb-1.5">
              Vehicle Registration Plate
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={plateInput}
                onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
                placeholder="e.g. DL 1R AB 4589"
                className="flex-1 text-xs font-mono font-black tracking-widest px-3.5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1e2127] text-[#ffffff] focus:border-[#d4e751] outline-none uppercase"
              />
              <button
                onClick={handleSavePlate}
                disabled={savingPlate || !plateInput.trim()}
                className="px-4 py-2.5 bg-[#d4e751] hover:bg-[#e2f163] text-[#0b0c0e] text-xs font-mono font-bold rounded-xl transition disabled:opacity-50 shadow-md shadow-[#d4e751]/25 uppercase"
              >
                {savingPlate ? <Loader2 size={13} className="animate-spin text-[#0b0c0e]" /> : 'Log'}
              </button>
            </div>
          </div>

          {/* Action buttons: Trip Share + 1-Tap SOS */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleCopyTripShare}
              className="py-3 px-3.5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1e2127] hover:bg-[#252830] text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition shadow-2xs"
            >
              <Share2 size={13} className="text-[#d4e751]" />
              <span>Share Trip</span>
            </button>

            <button
              onClick={handleTriggerSOS}
              className="py-3 px-3.5 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-mono font-black flex items-center justify-center gap-1.5 shadow-lg shadow-[#ef4444]/30 transition uppercase"
            >
              <ShieldAlert size={14} />
              <span>1-Tap SOS</span>
            </button>
          </div>

          {copyFeedback && (
            <div className="p-2.5 bg-[#122218] border border-[#10b981]/50 text-[#86efac] rounded-xl text-xs text-center font-mono font-bold">
              {copyFeedback}
            </div>
          )}

          {/* RTO Notice */}
          <div className="p-3.5 bg-[#1e2127] border border-[rgba(255,255,255,0.08)] rounded-2xl text-[10px] text-[#8e95a0] leading-relaxed flex items-start gap-2">
            <Info size={14} className="text-[#d4e751] shrink-0 mt-0.5" />
            <span>
              <strong>RTO Compliance Notice:</strong> AutoSync is a zero-commission peer-to-peer student carpooling utility. No commercial ride-hailing fees are charged.
            </span>
          </div>
        </div>
      </div>

      {/* SOS MODAL */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#17191d] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#ef4444]">
            <div className="flex items-center gap-2 text-[#f87171] font-black text-base font-mono">
              <ShieldAlert size={22} />
              <span>Emergency SOS Protocol</span>
            </div>

            <p className="text-xs text-[#8e95a0] leading-relaxed font-medium">
              Live ride details have been flagged. Connect immediately to police or campus security:
            </p>

            <div className="space-y-2.5">
              <a
                href="tel:112"
                className="w-full py-3 bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#ef4444]/40 transition"
              >
                <PhoneCall size={14} />
                <span>Call Emergency 112</span>
              </a>

              {currentUser?.emergencyContact && (
                <a
                  href={`tel:${currentUser.emergencyContact}`}
                  className="w-full py-3 border border-[rgba(255,255,255,0.08)] bg-[#1e2127] text-white rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#252830] transition"
                >
                  <PhoneCall size={14} className="text-[#d4e751]" />
                  <span>Call Emergency Contact ({currentUser.emergencyContact})</span>
                </a>
              )}
            </div>

            <div className="bg-[#14161a] p-3 rounded-xl border border-[rgba(255,255,255,0.06)] text-[10px] font-mono space-y-1 text-[#8e95a0]">
              <div>Pool ID: {pool.id}</div>
              <div>Route: {pool.hub.name} → {pool.destination.name}</div>
              <div>Vehicle: {pool.vehicleNumber || 'Unregistered'}</div>
              <div>Riders: {pool.members.map((m) => m.user.name).join(', ')}</div>
            </div>

            <button
              onClick={() => setSosModalOpen(false)}
              className="w-full py-2.5 text-xs text-[#8e95a0] font-mono font-bold text-center hover:text-white"
            >
              Dismiss Window
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
