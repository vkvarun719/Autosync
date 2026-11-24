'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  MapPin,
  Users,
  Shield,
  ArrowRight,
  LogOut,
  RefreshCw,
  Clock,
  AlertCircle,
  Loader2,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Check
} from 'lucide-react'
import AutoSyncLogo from '@/components/Logo'
import type { User, Hub, Destination, Pool } from '@/types'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[320px] bg-[#12141a] rounded-2xl flex flex-col items-center justify-center text-[#9aa1b2] text-xs gap-2 border border-[#262b36]">
      <Loader2 size={22} className="animate-spin text-emerald-400" />
      <span>Loading campus map...</span>
    </div>
  ),
})

export default function CommuterDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [hubs, setHubs] = useState<Hub[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [activePools, setActivePools] = useState<Pool[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [matchingLoading, setMatchingLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [alertMsg, setAlertMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  // Selection states
  const [selectedHubId, setSelectedHubId] = useState<string>('')
  const [selectedDestId, setSelectedDestId] = useState<string>('')
  const [vehicleType, setVehicleType] = useState<'AUTO' | 'CAB'>('AUTO')
  const [womenOnly, setWomenOnly] = useState<boolean>(false)

  // Load user
  useEffect(() => {
    const userStr = localStorage.getItem('autosync_user')
    if (!userStr) {
      router.push('/')
      return
    }
    try {
      const u = JSON.parse(userStr)
      setCurrentUser(u)
    } catch {
      router.push('/')
    }
  }, [router])

  // Load hubs, destinations, and active pools
  const fetchData = useCallback(async () => {
    try {
      const [hubsRes, poolsRes] = await Promise.all([
        fetch('/api/hubs'),
        fetch('/api/pools')
      ])

      const hubsData = await hubsRes.json()
      const poolsData = await poolsRes.json()

      if (hubsData.hubs) setHubs(hubsData.hubs)
      if (hubsData.destinations) {
        setDestinations(hubsData.destinations)
        if (!selectedHubId && hubsData.hubs?.length > 0) {
          setSelectedHubId(hubsData.hubs[0].id)
        }
        if (!selectedDestId && hubsData.destinations?.length > 0) {
          setSelectedDestId(hubsData.destinations[0].id)
        }
      }

      if (poolsData.pools) setActivePools(poolsData.pools)
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoadingInitial(false)
      setRefreshing(false)
    }
  }, [selectedHubId, selectedDestId])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 4000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleLogout = () => {
    localStorage.removeItem('autosync_user')
    localStorage.removeItem('autosync_token')
    router.push('/')
  }

  const handleMatchPool = async () => {
    if (!currentUser || !selectedHubId || !selectedDestId) {
      setAlertMsg({ type: 'error', text: 'Please pick a pickup stop and campus drop-off.' })
      return
    }

    if (womenOnly && currentUser.gender !== 'FEMALE') {
      setAlertMsg({ type: 'error', text: 'Women-only pool is reserved for female students.' })
      return
    }

    setMatchingLoading(true)
    setAlertMsg(null)

    try {
      const res = await fetch('/api/pools/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hubId: selectedHubId,
          destinationId: selectedDestId,
          vehicleType,
          womenOnly,
          userId: currentUser.id
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Matching failed')

      if (data.pool?.id) {
        router.push(`/pool/${data.pool.id}`)
      }
    } catch (err: unknown) {
      setAlertMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not create or find a ride'
      })
    } finally {
      setMatchingLoading(false)
    }
  }

  const selectedHub = hubs.find((h) => h.id === selectedHubId) || null
  const selectedDest = destinations.find((d) => d.id === selectedDestId) || null

  if (loadingInitial) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-[#9aa1b2] bg-[#0f1115]">
        <Loader2 size={32} className="animate-spin text-emerald-400 mb-3" />
        <p className="text-sm font-semibold text-white">Loading AutoSync...</p>
        <p className="text-xs text-[#646c80] mt-1">Connecting to transit stops</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#f1f3f7] flex flex-col selection:bg-emerald-500 selection:text-[#0f1115]">
      {/* Navbar */}
      <header className="w-full border-b border-[#262b36] sticky top-0 z-40 bg-[#0f1115]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <AutoSyncLogo size={32} />

          {/* User info and actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 bg-[#171a21] border border-[#262b36] py-1.5 px-3 rounded-xl text-xs">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center text-xs">
                {currentUser?.name?.charAt(0) || 'S'}
              </span>
              <span className="font-semibold text-white">{currentUser?.name}</span>
            </div>

            <button
              onClick={() => { setRefreshing(true); fetchData(); }}
              title="Refresh rides"
              className="w-10 h-10 rounded-xl border border-[#262b36] bg-[#171a21] hover:bg-[#1c202a] text-[#9aa1b2] hover:text-white flex items-center justify-center transition duration-150"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin text-emerald-400' : ''} />
            </button>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="w-10 h-10 rounded-xl border border-[#262b36] bg-[#171a21] hover:bg-red-950/40 hover:border-red-500/40 text-[#9aa1b2] hover:text-red-400 flex items-center justify-center transition duration-150"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Route Setup & Open Rides (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Find / Create Ride Card */}
            <div className="rounded-2xl border border-[#262b36] bg-[#171a21] p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Plan your commute</h2>
                <p className="text-xs text-[#9aa1b2] mt-0.5">
                  Pick your stop and get matched with students heading to campus.
                </p>
              </div>

              {/* Pickup Hub Select */}
              <div>
                <label className="block text-xs font-semibold text-[#9aa1b2] mb-1.5">
                  Pickup Stop
                </label>
                <div className="relative">
                  <select
                    value={selectedHubId}
                    onChange={(e) => setSelectedHubId(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-3 rounded-xl border border-[#262b36] bg-[#0f1115] text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition appearance-none cursor-pointer"
                  >
                    {hubs.map((hub) => (
                      <option key={hub.id} value={hub.id}>
                        {hub.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9aa1b2] text-xs">
                    ▾
                  </div>
                </div>
              </div>

              {/* Campus Drop-off Select */}
              <div>
                <label className="block text-xs font-semibold text-[#9aa1b2] mb-1.5">
                  Campus Destination
                </label>
                <div className="relative">
                  <select
                    value={selectedDestId}
                    onChange={(e) => setSelectedDestId(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-3 rounded-xl border border-[#262b36] bg-[#0f1115] text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition appearance-none cursor-pointer"
                  >
                    {destinations.map((dest) => (
                      <option key={dest.id} value={dest.id}>
                        {dest.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9aa1b2] text-xs">
                    ▾
                  </div>
                </div>
              </div>

              {/* Vehicle Type (Auto vs Cab) */}
              <div>
                <label className="block text-xs font-semibold text-[#9aa1b2] mb-2">
                  Ride Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVehicleType('AUTO')}
                    className={`p-3.5 rounded-xl border text-left transition duration-150 ${
                      vehicleType === 'AUTO'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-xs'
                        : 'border-[#262b36] bg-[#0f1115] text-[#9aa1b2] hover:border-[#363d4d]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">🛺 Auto</span>
                      <span className="text-[10px] font-semibold text-emerald-400">Max 3</span>
                    </div>
                    <span className="text-[11px] text-[#9aa1b2] block">3 seats capacity</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVehicleType('CAB')}
                    className={`p-3.5 rounded-xl border text-left transition duration-150 ${
                      vehicleType === 'CAB'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-xs'
                        : 'border-[#262b36] bg-[#0f1115] text-[#9aa1b2] hover:border-[#363d4d]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">🚕 Cab</span>
                      <span className="text-[10px] font-semibold text-emerald-400">Max 4</span>
                    </div>
                    <span className="text-[11px] text-[#9aa1b2] block">4 seats capacity</span>
                  </button>
                </div>
              </div>

              {/* Women-Only Pool Switch */}
              <div
                onClick={() => setWomenOnly(!womenOnly)}
                className={`p-3.5 rounded-xl border cursor-pointer transition duration-150 flex items-center justify-between ${
                  womenOnly
                    ? 'border-pink-500/60 bg-pink-950/20'
                    : 'border-[#262b36] bg-[#0f1115] hover:border-[#363d4d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    womenOnly ? 'bg-pink-500/20 text-pink-400' : 'bg-[#171a21] text-[#9aa1b2]'
                  }`}>
                    <Shield size={16} />
                  </div>
                  <div>
                    <div className={`text-xs font-semibold ${womenOnly ? 'text-pink-300' : 'text-white'}`}>
                      Women-only ride
                    </div>
                    <div className="text-[11px] text-[#9aa1b2]">
                      Match with female students only
                    </div>
                  </div>
                </div>

                <div className={`w-10 h-5 flex items-center rounded-full p-0.5 transition duration-150 ${
                  womenOnly ? 'bg-pink-500' : 'bg-[#262b36]'
                }`}>
                  <div className={`bg-white w-4 h-4 rounded-full transition-transform duration-150 ${
                    womenOnly ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </div>

              {alertMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    alertMsg.type === 'error'
                      ? 'bg-red-950/50 border border-red-500/50 text-red-200'
                      : 'bg-emerald-950/50 border border-emerald-500/50 text-emerald-200'
                  }`}
                >
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{alertMsg.text}</span>
                </div>
              )}

              {/* Primary Match CTA */}
              <button
                onClick={handleMatchPool}
                disabled={matchingLoading}
                className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0f1115] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition duration-150 disabled:opacity-50"
              >
                {matchingLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-[#0f1115]" />
                    <span>Matching with students...</span>
                  </>
                ) : (
                  <>
                    <span>Find or Start Ride</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>

            {/* Active Pools List */}
            <div className="rounded-2xl border border-[#262b36] bg-[#171a21] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[#262b36] pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Users size={14} className="text-emerald-400" />
                  <span>Available rides nearby ({activePools.length})</span>
                </span>
                <span className="text-[11px] text-[#9aa1b2]">Auto-refreshes</span>
              </div>

              {activePools.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#9aa1b2] space-y-1">
                  <p className="font-semibold text-white">No open rides at this stop</p>
                  <p className="text-[11px]">Click &quot;Find or Start Ride&quot; above to create one.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activePools.map((pool) => {
                    const isFull = pool.seatsAvailable <= 0
                    const isMyPool = pool.members.some((m) => m.userId === currentUser?.id)

                    return (
                      <div
                        key={pool.id}
                        onClick={() => router.push(`/pool/${pool.id}`)}
                        className="p-3.5 rounded-xl border border-[#262b36] hover:border-emerald-500/50 bg-[#0f1115] transition duration-150 cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {pool.hub.name} ➔ {pool.destination.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isFull
                                ? 'bg-red-950/60 text-red-300 border border-red-500/40'
                                : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {isFull ? 'FULL' : `${pool.seatsAvailable} open`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-[#9aa1b2]">
                          <div className="flex items-center gap-2">
                            <span>{pool.vehicleType === 'AUTO' ? '🛺 Auto' : '🚕 Cab'}</span>
                            <span>•</span>
                            <span>{pool.members.length}/{pool.maxSeats} riders</span>
                            {pool.womenOnly && (
                              <>
                                <span>•</span>
                                <span className="text-pink-400 font-semibold">Women pool</span>
                              </>
                            )}
                          </div>

                          <span className="text-emerald-400 font-semibold flex items-center gap-0.5 text-xs">
                            {isMyPool ? 'Joined' : 'Join'} <ArrowUpRight size={13} />
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Campus Map & Route Telemetry (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-[#262b36] bg-[#171a21] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Campus transit map</h3>
                  <p className="text-xs text-[#9aa1b2]">Stations and gates within 300m pickup radius</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  Live View
                </span>
              </div>

              {/* Map Container */}
              <div className="h-[400px] lg:h-[480px] w-full rounded-xl overflow-hidden border border-[#262b36]">
                <MapView
                  hubs={hubs}
                  destinations={destinations}
                  selectedHub={selectedHub}
                  selectedDest={selectedDest}
                  pools={activePools}
                />
              </div>

              {/* Selected Route Info Strip */}
              {selectedHub && selectedDest && (
                <div className="p-3.5 rounded-xl border border-[#262b36] bg-[#0f1115] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-white block">
                      {selectedHub.name} ➔ {selectedDest.name}
                    </span>
                    <span className="text-[#9aa1b2] text-[11px]">
                      Average split: ₹25 - ₹35 per student
                    </span>
                  </div>
                  <span className="text-emerald-400 font-semibold">
                    ~7 min ride
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
