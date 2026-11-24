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
  Filter
} from 'lucide-react'
import type { User, Hub, Destination, Pool } from '@/types'

// Dynamic Leaflet map without SSR to prevent hydration mismatch
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[220px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs gap-2">
      <Loader2 size={16} className="animate-spin text-indigo-500" />
      <span>Loading OpenStreetMap transit hubs...</span>
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
        // Set smart defaults if not selected yet
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
    // Poll every 5 seconds for nearby pool updates
    const interval = setInterval(fetchData, 5000)
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 size={32} className="animate-spin text-indigo-600 mb-3" />
        <p className="text-xs font-semibold">Connecting to transit network...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
            ⚡
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">
              AutoSync
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <span>{currentUser?.name}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-indigo-600 font-semibold">{currentUser?.rollId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setRefreshing(true); fetchData(); }}
            title="Refresh active pools"
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Interactive Transit Map */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Navigation size={12} className="text-indigo-600" />
              Live Transit Network
            </span>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
              300m Clustering Active
            </span>
          </div>

          <div className="h-52 w-full rounded-2xl overflow-hidden shadow-sm">
            <MapView
              hubs={hubs}
              destinations={destinations}
              selectedHub={selectedHub}
              selectedDest={selectedDest}
              pools={activePools}
            />
          </div>
        </div>

        {/* Commute Route Configurator */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin size={14} className="text-indigo-600" />
              Plan Your Commute
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              10-min window
            </span>
          </div>

          {/* Pickup Hub Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Pickup Transit Hub (Metro / Bus Gate)
            </label>
            <select
              value={selectedHubId}
              onChange={(e) => setSelectedHubId(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              {hubs.map((hub) => (
                <option key={hub.id} value={hub.id}>
                  {hub.type === 'METRO' ? '🚊 ' : hub.type === 'BUS' ? '🚌 ' : '🚉 '}
                  {hub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Campus Drop-off Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Campus Destination Drop-Off
            </label>
            <select
              value={selectedDestId}
              onChange={(e) => setSelectedDestId(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              {destinations.map((dest) => (
                <option key={dest.id} value={dest.id}>
                  🏫 {dest.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Type (Auto vs Cab) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
              Vehicle Capacity (RTO Strict Guardrails)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVehicleType('AUTO')}
                className={`py-2.5 px-3 rounded-xl border text-left transition-all ${
                  vehicleType === 'AUTO'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">🛺 Auto-Rickshaw</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                    Max 3
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Best for quick & budget commutes
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVehicleType('CAB')}
                className={`py-2.5 px-3 rounded-xl border text-left transition-all ${
                  vehicleType === 'CAB'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">🚕 Cab / Taxi</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                    Max 4
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Air-conditioned shared comfort
                </div>
              </button>
            </div>
          </div>

          {/* Women-Only Pool toggle */}
          <div className="pt-1">
            <label className="flex items-center justify-between p-2.5 rounded-xl border border-pink-100 bg-pink-50/40 cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center">
                  <Shield size={14} />
                </div>
                <div>
                  <div className="text-xs font-bold text-pink-900">
                    Women-Only Commute Pool
                  </div>
                  <div className="text-[10px] text-pink-700">
                    Match exclusively with verified female students
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={womenOnly}
                onChange={(e) => setWomenOnly(e.target.checked)}
                className="w-4 h-4 text-pink-600 rounded border-slate-300 focus:ring-pink-500 cursor-pointer"
              />
            </label>
          </div>

          {alertMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                alertMsg.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}
            >
              <AlertCircle size={15} className="shrink-0" />
              <span>{alertMsg.text}</span>
            </div>
          )}

          {/* Match / Create Button */}
          <button
            onClick={handleMatchPool}
            disabled={matchingLoading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {matchingLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Running Geospatial Match Engine...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-yellow-300" />
                <span>Find or Create Priority Pool</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

        {/* Active Nearby Pools List */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={12} className="text-indigo-600" />
              Active Waiting Pools ({activePools.length})
            </span>
            <span className="text-[10px] text-slate-400">
              Live updates every 5s
            </span>
          </div>

          {activePools.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center">
              <div className="text-2xl mb-1">🚊</div>
              <p className="text-xs font-semibold text-slate-700">
                No active pools at this moment
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click &quot;Find or Create Priority Pool&quot; above to be the first rider and lead the pool!
              </p>
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
                    className="bg-white border border-slate-200 hover:border-indigo-400 p-3.5 rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {pool.hub.name}
                        </span>
                        <ChevronRight size={12} className="text-slate-400" />
                        <span className="text-xs font-semibold text-indigo-700">
                          {pool.destination.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {pool.vehicleType === 'AUTO' ? '🛺 Auto' : '🚕 Cab'}
                        </span>
                        <span>•</span>
                        <span>
                          {pool.members.length}/{pool.maxSeats} riders joined
                        </span>
                        {pool.womenOnly && (
                          <>
                            <span>•</span>
                            <span className="text-pink-600 font-semibold flex items-center gap-0.5">
                              <Shield size={10} /> Women Pool
                            </span>
                          </>
                        )}
                        {isMyPool && (
                          <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                            You joined
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isFull
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isFull ? 'Full' : `${pool.seatsAvailable} seat${pool.seatsAvailable > 1 ? 's' : ''} left`}
                      </span>
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
