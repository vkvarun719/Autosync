'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  Users,
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
  UserPlus,
  RefreshCw,
  Info,
  ExternalLink,
  Navigation
} from 'lucide-react'
import AutoSyncLogo from '@/components/Logo'
import type { Pool, User } from '@/types'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[220px] bg-[#12141a] rounded-xl flex items-center justify-center text-[#9aa1b2] text-xs">
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
  'In auto now',
  'Reached campus'
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

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('autosync_user')
    if (!userStr) {
      router.push('/login')
      return
    }
    try {
      setCurrentUser(JSON.parse(userStr))
    } catch {
      router.push('/login')
    }
  }, [router])

  const fetchPoolData = useCallback(async () => {
    if (!poolId) return
    try {
      const res = await fetch(`/api/pools/${poolId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch ride')
      setPool(data.pool)
      if (data.pool?.vehicleNumber) {
        setPlateInput(data.pool.vehicleNumber)
      }
      if (data.pool?.totalFare) {
        setFareInput(String(data.pool.totalFare))
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error syncing ride')
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

  // Countdown timer (10 mins from createdAt)
  const [timeLeft, setTimeLeft] = useState<string>('10:00')
  useEffect(() => {
    if (!pool?.createdAt) return
    const updateCountdown = () => {
      const created = new Date(pool.createdAt).getTime()
      const expiry = created + 10 * 60 * 1000
      const now = Date.now()
      const diff = Math.max(0, expiry - now)

      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`)
    }
    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [pool?.createdAt])

  const handleSimulateRider = async () => {
    if (!poolId) return
    setSimulating(true)
    try {
      const res = await fetch(`/api/pools/${poolId}/simulate-rider`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to simulate student')
      await fetchPoolData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Simulation failed')
    } finally {
      setSimulating(false)
    }
  }

  const handleSendQuickStatus = async (status: string) => {
    if (!poolId || !currentUser) return
    setSendingStatus(true)
    try {
      const res = await fetch(`/api/pools/${poolId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, status }),
      })
      if (!res.ok) throw new Error('Status update failed')
      setMyStatus(status)
      await fetchPoolData()
    } catch (err) {
      console.error(err)
    } finally {
      setSendingStatus(false)
    }
  }

  const handleSavePlate = async () => {
    if (!poolId || !plateInput.trim()) return
    setSavingPlate(true)
    try {
      const res = await fetch(`/api/pools/${poolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleNumber: plateInput.trim() }),
      })
      if (!res.ok) throw new Error('Failed to update plate')
      await fetchPoolData()
      setCopyFeedback('Auto registration number saved!')
      setTimeout(() => setCopyFeedback(null), 2500)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingPlate(false)
    }
  }

  const handleCalculateFare = async () => {
    const total = parseFloat(fareInput)
    if (isNaN(total) || total <= 0) {
      alert('Please enter a valid fare amount in ₹ INR')
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
      if (!res.ok) throw new Error(data.error || 'Failed to calculate split')
      await fetchPoolData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Calculation failed')
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
    const shareText = `🚨 AutoSync Ride Share\n📍 Route: ${pool.hub.name} ➔ ${pool.destination.name}\n🛺 Vehicle: ${pool.vehicleType} ${pool.vehicleNumber ? `[${pool.vehicleNumber}]` : '(Not registered)'}\n👥 Students: ${ridersList}\n🔗 Link: ${window.location.href}`

    navigator.clipboard.writeText(shareText)
    setCopyFeedback('Ride share text copied!')
    setTimeout(() => setCopyFeedback(null), 3000)
  }

  const isRideLead = currentUser?.id === pool?.leadId
  const leadUpi = pool?.lead?.defaultUpiId || 'campus.autosync@okaxis'
  const leadName = pool?.lead?.name || 'Ride Lead'

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-[#9aa1b2] bg-[#0f1115]">
        <Loader2 size={32} className="animate-spin text-emerald-400 mb-3" />
        <p className="text-sm font-semibold text-white">Opening ride room...</p>
      </div>
    )
  }

  if (!pool) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-[#f1f3f7] bg-[#0f1115]">
        <div className="w-12 h-12 rounded-xl bg-red-950/50 text-red-400 flex items-center justify-center mb-3 border border-red-500/40">
          <AlertTriangle size={22} />
        </div>
        <p className="text-sm font-semibold text-white mb-2">{errorMsg || 'Ride not found'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-xs text-emerald-400 font-semibold underline"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  const seatsOccupied = pool.members.length
  const isFull = pool.seatsAvailable <= 0

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#f1f3f7] flex flex-col selection:bg-emerald-500 selection:text-[#0f1115]">
      {/* Navbar */}
      <header className="w-full border-b border-[#262b36] sticky top-0 z-40 bg-[#0f1115]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#9aa1b2] hover:text-white transition duration-150 py-2 px-3 rounded-lg border border-[#262b36] bg-[#171a21]"
          >
            <ChevronLeft size={16} />
            <span>Dashboard</span>
          </button>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isFull
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                  : 'bg-[#202530] text-[#9aa1b2] border border-[#262b36]'
              }`}
            >
              {isFull ? 'Ride Full' : `${pool.seatsAvailable} seat${pool.seatsAvailable > 1 ? 's' : ''} left`}
            </span>

            <span className="text-xs font-medium text-white px-2.5 py-1 rounded-full border border-[#262b36] bg-[#171a21]">
              ⏱️ {timeLeft}
            </span>

            <button
              onClick={fetchPoolData}
              title="Refresh"
              className="w-9 h-9 rounded-lg border border-[#262b36] bg-[#171a21] hover:bg-[#1c202a] text-[#9aa1b2] hover:text-white flex items-center justify-center transition"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* SOS Alert Bar */}
      {(pool.sosTriggered || sosModalOpen) && (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="bg-red-600 text-white p-3.5 rounded-xl flex items-center justify-between text-xs shadow-md">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert size={18} />
              <span>Emergency SOS active for this ride</span>
            </div>
            <button
              onClick={() => setSosModalOpen(true)}
              className="bg-white text-red-600 px-3 py-1 rounded-lg font-bold text-xs shadow-xs"
            >
              Details
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Route, Map & Co-Riders (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Route & Map Card */}
            <div className="rounded-2xl border border-[#262b36] bg-[#171a21] p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-[#9aa1b2]">
                    {pool.vehicleType === 'AUTO' ? '🛺 Shared Auto' : '🚕 Shared Cab'} (Max {pool.maxSeats})
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                    {pool.hub.name} ➔ {pool.destination.name}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${pool.hub.lat},${pool.hub.lng}&destination=${pool.destination.lat},${pool.destination.lng}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open live directions in Google Maps"
                    className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Navigation size={13} />
                    <span>Open in Google Maps</span>
                    <ExternalLink size={12} />
                  </a>

                  {pool.womenOnly && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-pink-500/30 bg-pink-950/30 text-pink-300 flex items-center gap-1">
                      <Shield size={12} /> Women Only
                    </span>
                  )}
                </div>
              </div>

              {/* Map Preview */}
              <div className="h-48 sm:h-56 w-full rounded-xl overflow-hidden border border-[#262b36]">
                <MapView
                  hubs={[pool.hub]}
                  destinations={[pool.destination]}
                  selectedHub={pool.hub}
                  selectedDest={pool.destination}
                />
              </div>
            </div>

            {/* Co-Riders Manifest */}
            <div className="rounded-2xl border border-[#262b36] bg-[#171a21] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#262b36] pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Users size={15} className="text-emerald-400" />
                  <span>Riders in this pool ({seatsOccupied}/{pool.maxSeats})</span>
                </span>
                <span className="text-[11px] text-[#9aa1b2]">Live 3s sync</span>
              </div>

              <div className="space-y-2.5">
                {pool.members.map((member) => {
                  const isLead = member.userId === pool.leadId
                  const isMe = member.userId === currentUser?.id
                  const isPaid = member.status === 'PAID'

                  return (
                    <div
                      key={member.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition duration-150 ${
                        isMe
                          ? 'border-emerald-500/60 bg-[#12141a]'
                          : 'border-[#262b36] bg-[#0f1115]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {member.user.gender === 'FEMALE' ? '👩🏽' : '👨🏽'}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">
                              {member.user.name}
                            </span>
                            {isMe && (
                              <span className="text-[10px] bg-emerald-500 text-[#0f1115] font-bold px-1.5 py-0.2 rounded">
                                YOU
                              </span>
                            )}
                            {isLead && (
                              <span className="text-[10px] text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                <Crown size={10} /> Lead
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#9aa1b2] mt-0.5">
                            {member.user.rollId}
                          </div>
                          {member.quickStatus && (
                            <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
                              <MessageSquare size={11} />
                              <span>&quot;{member.quickStatus}&quot;</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        {member.shareAmt ? (
                          <div>
                            <div className="text-xs font-bold text-white">
                              ₹{member.shareAmt}
                            </div>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                isPaid
                                  ? 'bg-emerald-950/60 text-emerald-300'
                                  : 'bg-[#262b36] text-[#9aa1b2]'
                              }`}
                            >
                              {isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#9aa1b2] font-medium">
                            Joined
                          </span>
                        )}

                        {isRideLead && !isLead && (
                          <button
                            onClick={() => handleTransferLead(member.userId)}
                            className="block text-[10px] text-emerald-400 hover:underline mt-1 font-semibold"
                          >
                            Make Lead
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Empty Seats */}
                {Array.from({ length: pool.seatsAvailable }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="p-3 rounded-xl border border-dashed border-[#262b36] text-xs text-[#646c80] flex items-center justify-between"
                  >
                    <span>Seat #{seatsOccupied + i + 1} Available</span>
                    <span className="text-[11px]">Waiting...</span>
                  </div>
                ))}
              </div>

                {/* Simulate Student Button */}
                {!isFull && (
                  <button
                    onClick={handleSimulateRider}
                    disabled={simulating}
                    className="w-full h-11 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 transition duration-150 disabled:opacity-50"
                  >
                    {simulating ? (
                      <>
                        <Loader2 size={15} className="animate-spin text-emerald-400" />
                        <span>Simulating rider...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={15} />
                        <span>Simulate Another Student (Solo Test)</span>
                      </>
                    )}
                  </button>
                )}
            </div>

            {/* Quick Status Chips */}
            <div className="rounded-2xl border border-[#262b36] bg-[#171a21] p-5 shadow-sm space-y-3">
              <span className="text-xs font-bold text-white block">
                Broadcast quick status to co-riders
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSendQuickStatus(opt)}
                    disabled={sendingStatus}
                    className={`text-xs px-3 py-2 rounded-xl border transition duration-150 ${
                      myStatus === opt
                        ? 'border-emerald-500 bg-emerald-500 text-[#0f1115] font-bold'
                        : 'border-[#262b36] bg-[#0f1115] text-[#9aa1b2] hover:border-[#363d4d] hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: UPI Split & Safety (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Fare Split Card */}
            <div className="rounded-2xl border border-[#262b36] bg-[#171a21] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#262b36] pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <DollarSign size={15} className="text-emerald-400" />
                  <span>Fare Split & UPI</span>
                </span>
                {isRideLead && (
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                    You are Lead
                  </span>
                )}
              </div>

              {/* Ride Lead Input */}
              {isRideLead && (
                <div className="p-3.5 rounded-xl border border-[#262b36] bg-[#0f1115] space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#9aa1b2] mb-1">
                        Driver Fare (₹)
                      </label>
                      <input
                        type="number"
                        value={fareInput}
                        onChange={(e) => setFareInput(e.target.value)}
                        placeholder="e.g. 90"
                        className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-[#262b36] bg-[#171a21] text-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#9aa1b2] mb-1">
                        Split Rule
                      </label>
                      <select
                        value={splitMode}
                        onChange={(e) => setSplitMode(e.target.value as 'EQUAL' | 'PROPORTIONAL')}
                        className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg border border-[#262b36] bg-[#171a21] text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="EQUAL">Equal</option>
                        <option value="PROPORTIONAL">By Distance</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleCalculateFare}
                    disabled={settling}
                    className="w-full h-10 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#0f1115] font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    {settling ? (
                      <Loader2 size={14} className="animate-spin text-[#0f1115]" />
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Calculate UPI Shares</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Share Breakdown & QR Codes */}
              {pool.totalFare ? (
                <div className="space-y-3 pt-1">
                  <div className="text-xs text-[#9aa1b2] flex items-center justify-between p-2.5 rounded-xl bg-[#0f1115]">
                    <span>Total: ₹{pool.totalFare}</span>
                    <span>Lead UPI: {leadUpi}</span>
                  </div>

                  <div className="space-y-2.5">
                    {pool.members.map((member) => {
                      const share = member.shareAmt || (pool.totalFare ? Math.round((pool.totalFare / pool.members.length) * 100) / 100 : 0)
                      const isLead = member.userId === pool.leadId
                      const isPaid = member.status === 'PAID'
                      const isCurrentRider = member.userId === currentUser?.id

                      const upiDeepLink = `upi://pay?pa=${encodeURIComponent(leadUpi)}&pn=${encodeURIComponent(leadName)}&am=${share.toFixed(2)}&cu=INR&tn=AutoSync_${pool.id}`

                      return (
                        <div
                          key={`split-${member.id}`}
                          className="p-3.5 rounded-xl border border-[#262b36] bg-[#0f1115] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-white">
                                {member.user.name} {isLead && <span className="text-emerald-400 font-normal">(Receives)</span>}
                              </div>
                              <div className="text-sm font-bold text-emerald-400">
                                ₹{share.toFixed(2)}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {isPaid ? (
                                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 size={13} /> Paid
                                </span>
                              ) : (
                                isRideLead && !isLead && (
                                  <button
                                    onClick={() => handleMarkPaid(member.userId)}
                                    className="text-[10px] bg-emerald-500 hover:bg-emerald-400 text-[#0f1115] font-bold px-2.5 py-1.5 rounded-lg transition"
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
                                  className="text-[10px] border border-[#262b36] bg-[#171a21] hover:bg-[#202530] text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                                >
                                  <QrCode size={13} />
                                  <span>{selectedRiderForQr === member.id ? 'Hide' : 'QR Code'}</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Dynamic Scannable QR Code */}
                          {!isLead && (selectedRiderForQr === member.id || isCurrentRider) && (
                            <div className="pt-2 border-t border-[#262b36] flex flex-col items-center gap-2.5">
                              <UpiQrCode value={upiDeepLink} size={120} />
                              <span className="text-[10px] text-[#9aa1b2]">
                                Scan via GPay, PhonePe, Paytm, or BHIM
                              </span>

                              <div className="w-full flex gap-2">
                                <a
                                  href={upiDeepLink}
                                  className="flex-1 h-9 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#0f1115] font-bold text-xs flex items-center justify-center transition"
                                >
                                  Open UPI App
                                </a>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(upiDeepLink)
                                    setCopyFeedback('UPI link copied!')
                                    setTimeout(() => setCopyFeedback(null), 2000)
                                  }}
                                  className="px-3 h-9 rounded-lg border border-[#262b36] bg-[#171a21] text-white text-xs font-semibold flex items-center gap-1 hover:bg-[#202530] transition"
                                >
                                  <Copy size={13} />
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
                <p className="text-xs text-[#9aa1b2] p-3 text-center">
                  {isRideLead
                    ? 'Enter the auto fare above to compute student shares.'
                    : 'Waiting for Ride Lead to enter driver fare...'}
                </p>
              )}
            </div>

            {/* Safety Bar Card */}
            <div className="rounded-2xl border border-[#262b36] bg-[#171a21] p-5 shadow-sm space-y-3.5">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Shield size={15} className="text-red-400" />
                <span>Ride Safety</span>
              </span>

              {/* Plate Logger */}
              <div>
                <label className="block text-[11px] font-semibold text-[#9aa1b2] mb-1">
                  Auto Registration Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={plateInput}
                    onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
                    placeholder="DL 1R AB 4589"
                    className="flex-1 text-xs font-bold px-3 py-2 rounded-lg border border-[#262b36] bg-[#0f1115] text-white focus:border-emerald-500 outline-none uppercase"
                  />
                  <button
                    onClick={handleSavePlate}
                    disabled={savingPlate || !plateInput.trim()}
                    className="h-9 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#0f1115] font-bold text-xs transition disabled:opacity-50"
                  >
                    {savingPlate ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={handleCopyTripShare}
                  className="h-10 rounded-lg border border-[#262b36] bg-[#0f1115] hover:bg-[#171a21] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Share2 size={13} className="text-emerald-400" />
                  <span>Share Trip</span>
                </button>

                <button
                  onClick={handleTriggerSOS}
                  className="h-10 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <ShieldAlert size={14} />
                  <span>1-Tap SOS</span>
                </button>
              </div>

              {copyFeedback && (
                <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs text-center font-medium">
                  {copyFeedback}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* SOS MODAL */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#171a21] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-red-500/60">
            <div className="flex items-center gap-2 text-red-400 font-bold text-base">
              <ShieldAlert size={20} />
              <span>Emergency SOS Protocol</span>
            </div>

            <p className="text-xs text-[#9aa1b2] leading-relaxed">
              Ride details flagged. Connect with police or your emergency contact:
            </p>

            <div className="space-y-2.5">
              <a
                href="tel:112"
                className="w-full h-11 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
              >
                <PhoneCall size={15} />
                <span>Call Emergency 112</span>
              </a>

              {currentUser?.emergencyContact && (
                <a
                  href={`tel:${currentUser.emergencyContact}`}
                  className="w-full h-11 border border-[#262b36] bg-[#0f1115] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#202530] transition"
                >
                  <PhoneCall size={15} className="text-emerald-400" />
                  <span>Call Emergency Contact</span>
                </a>
              )}
            </div>

            <button
              onClick={() => setSosModalOpen(false)}
              className="w-full h-9 text-xs text-[#9aa1b2] font-semibold text-center hover:text-white"
            >
              Dismiss Window
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
