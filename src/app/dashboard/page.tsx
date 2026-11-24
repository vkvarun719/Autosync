'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  MapPin,
  Navigation,
  Users,
  Car,
  Shield,
  Sparkles,
  ArrowRight,
  LogOut,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Filter,
  Zap,
  ArrowUpRight
} from 'lucide-react'
import type { User, Hub, Destination, Pool } from '@/types'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[220px] bg-slate-900/5 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-slate-500 text-xs gap-2 border border-slate-200">
      <Loader2 size={18} className="animate-spin text-indigo-600" />
      <span className="font-medium">Connecting to campus transit nodes...</span>
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

  // Handle Find or Create Pool with Matching Engine
  const handleMatchPool = async () => {
    if (!currentUser || !selectedHubId || !selectedDestId) {
      setAlertMsg({ type: 'error', text: 'Please pick a Pickup Hub and Campus Drop-off.' })
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
        text: err instanceof Error ? err.message : 'Failed to match or create pool'
      })
    } finally {
      setMatchingLoading(false)
    }
  }

  const selectedHub = hubs.find((h) => h.id === selectedHubId) || null
  const selectedDest = destinations.find((d) => d.id === selectedDestId) || null

  if (loadingInitial) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-500 bg-white">
        <Loader2 size={32} className="animate-spin text-indigo-600 mb-3" />
        <p className="text-xs font-bold tracking-tight text-slate-800">Connecting to AutoSync Network...</p>
        <p className="text-[10px] text-slate-400 mt-1">Calibrating 300m geospatial clusters</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Sleek Classy Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/20">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-slate-900 leading-tight">
                AutoSync
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium mt-0.5">
              <span>{currentUser?.name}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-indigo-700 font-bold">{currentUser?.rollId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setRefreshing(true); fetchData(); }}
            title="Refresh active pools"
            className="w-8 h-8 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white flex items-center justify-center text-slate-500 hover:text-indigo-600 transition shadow-xs"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-indigo-600' : ''} />
          </button>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="w-8 h-8 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center text-slate-400 hover:text-rose-600 transition shadow-xs"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Interactive Map with Card Header */}
        <div>
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Navigation size={13} className="text-indigo-600" />
              <span>Campus Transit Map</span>
            </span>
            <div className="flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
              <span>300m Cluster Active</span>
            </div>
          </div>

          <div className="h-52 w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200">
            <MapView
              hubs={hubs}
              destinations={destinations}
              selectedHub={selectedHub}
              selectedDest={selectedDest}
              pools={activePools}
            />
          </div>
        </div>

        {/* Commute Route Configurator Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <MapPin size={13} />
              </div>
              <span>Coordinate Your Shared Ride</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
              10-min window
            </span>
          </div>

          {/* Pickup Hub Select */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Pickup Transit Hub
            </label>
            <div className="relative">
              <select
                value={selectedHubId}
                onChange={(e) => setSelectedHubId(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 outline-none transition shadow-xs appearance-none"
              >
                {hubs.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    {hub.type === 'METRO' ? '🚊 ' : hub.type === 'BUS' ? '🚌 ' : '🚉 '}
                    {hub.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                ▾
              </div>
            </div>
          </div>

          {/* Campus Drop-off Select */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Campus Destination Drop-Off
            </label>
            <div className="relative">
              <select
                value={selectedDestId}
                onChange={(e) => setSelectedDestId(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 outline-none transition shadow-xs appearance-none"
              >
                {destinations.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    🏫 {dest.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                ▾
              </div>
            </div>
          </div>

          {/* Vehicle Capacity (Auto vs Cab) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-2">
              Vehicle Capacity (Strict RTO Limits)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* AUTO OPTION */}
              <button
                type="button"
                onClick={() => setVehicleType('AUTO')}
                className={`py-3 px-3.5 rounded-2xl border text-left transition-all duration-200 ${
                  vehicleType === 'AUTO'
                    ? 'border-indigo-600 bg-gradient-to-br from-indigo-50/90 to-purple-50/50 text-indigo-950 shadow-sm ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs flex items-center gap-1.5">
                    <span>🛺</span>
                    <span>Auto</span>
                  </span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                    Max 3
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <span className="text-indigo-600 font-bold">● ● ●</span>
                  <span>Seats</span>
                </div>
              </button>

              {/* CAB OPTION */}
              <button
                type="button"
                onClick={() => setVehicleType('CAB')}
                className={`py-3 px-3.5 rounded-2xl border text-left transition-all duration-200 ${
                  vehicleType === 'CAB'
                    ? 'border-indigo-600 bg-gradient-to-br from-indigo-50/90 to-purple-50/50 text-indigo-950 shadow-sm ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs flex items-center gap-1.5">
                    <span>🚕</span>
                    <span>Cab</span>
                  </span>
                  <span className="text-[9px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-full border border-indigo-200">
                    Max 4
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <span className="text-indigo-600 font-bold">● ● ● ●</span>
                  <span>Seats</span>
                </div>
              </button>
            </div>
          </div>

          {/* Women-Only Pool Card Toggle */}
          <div className="pt-1">
            <div
              onClick={() => setWomenOnly(!womenOnly)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                womenOnly
                  ? 'border-pink-300 bg-gradient-to-r from-pink-50 to-rose-50/50 shadow-xs'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                  womenOnly ? 'bg-pink-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
                }`}>
                  <Shield size={15} />
                </div>
                <div>
                  <div className={`text-xs font-bold ${womenOnly ? 'text-pink-900' : 'text-slate-800'}`}>
                    Women-Only Commute Pool
                  </div>
                  <div className={`text-[10px] ${womenOnly ? 'text-pink-700' : 'text-slate-500'}`}>
                    Match exclusively with verified female riders
                  </div>
                </div>
              </div>

              <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                womenOnly ? 'bg-pink-600' : 'bg-slate-300'
              }`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  womenOnly ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </div>
          </div>

          {alertMsg && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
                alertMsg.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}
            >
              <AlertCircle size={16} className="shrink-0" />
              <span className="font-semibold">{alertMsg.text}</span>
            </div>
          )}

          {/* Match / Create Button with Glossy Gradient */}
          <button
            onClick={handleMatchPool}
            disabled={matchingLoading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
          >
            {matchingLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Running Geospatial Match Engine...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-amber-300" />
                <span>Find or Create Priority Pool</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

        {/* Active Nearby Pools List */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={13} className="text-indigo-600" />
              <span>Active Waiting Pools ({activePools.length})</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Live updates
            </span>
          </div>

          {activePools.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-8 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl mb-2.5">
                🛺
              </div>
              <p className="text-xs font-bold text-slate-800">
                No active pools at this hub
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed">
                Click &quot;Find or Create Priority Pool&quot; above to initiate a new pool and claim the Ride Lead!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activePools.map((pool) => {
                const isFull = pool.seatsAvailable <= 0
                const isMyPool = pool.members.some((m) => m.userId === currentUser?.id)
                const percentFilled = ((pool.members.length) / pool.maxSeats) * 100

                return (
                  <div
                    key={pool.id}
                    onClick={() => router.push(`/pool/${pool.id}`)}
                    className="group bg-white border border-slate-200 hover:border-indigo-500 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {pool.hub.name}
                        </span>
                        <ChevronRight size={13} className="text-slate-400" />
                        <span className="text-xs font-bold text-indigo-700">
                          {pool.destination.name}
                        </span>
                      </div>

                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          isFull
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isFull ? 'FULL' : `${pool.seatsAvailable} LEFT`}
                      </span>
                    </div>

                    {/* Progress bar visual */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${percentFilled}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {pool.vehicleType === 'AUTO' ? '🛺 Auto (3)' : '🚕 Cab (4)'}
                        </span>
                        <span>•</span>
                        <span>
                          {pool.members.length}/{pool.maxSeats} Commuters
                        </span>
                        {pool.womenOnly && (
                          <>
                            <span>•</span>
                            <span className="text-pink-600 font-bold flex items-center gap-0.5">
                              <Shield size={10} /> Women Pool
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-indigo-600 font-bold text-xs">
                        {isMyPool ? (
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            Joined
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5">
                            Join <ArrowUpRight size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
