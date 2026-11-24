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
  ArrowUpRight,
  Radio,
  Sliders,
  Check,
  Activity,
  Layers
} from 'lucide-react'
import type { User, Hub, Destination, Pool } from '@/types'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[220px] bg-[#15171b] rounded-2xl flex flex-col items-center justify-center text-[#8e95a0] text-xs gap-2 border border-[rgba(255,255,255,0.08)]">
      <Loader2 size={18} className="animate-spin text-[#d4e751]" />
      <span className="font-mono text-[11px]">Connecting to campus transit nodes...</span>
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-[#8e95a0] bg-[#121417]">
        <Loader2 size={32} className="animate-spin text-[#d4e751] mb-3" />
        <p className="text-xs font-mono font-bold text-white">INITIALIZING HAULIX FLEET TELEMETRY...</p>
        <p className="text-[10px] text-[#525866] font-mono mt-1">Calibrating 300m spatial clusters</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#121417] text-[#ffffff]">
      {/* Haulix Top Telemetry Header */}
      <div className="bg-[#17191d]/95 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)] px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#d4e751] text-[#0b0c0e] flex items-center justify-center font-black text-sm shadow-md shadow-[#d4e751]/30">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white leading-tight">
                AutoSync Fleet
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block animate-pulse" />
            </div>
            <div className="text-[10px] text-[#8e95a0] flex items-center gap-1 font-mono mt-0.5">
              <span>{currentUser?.name}</span>
              <span className="text-[#525866]">•</span>
              <span className="text-[#d4e751] font-bold">{currentUser?.rollId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setRefreshing(true); fetchData(); }}
            title="Refresh active pools"
            className="w-8 h-8 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#1e2127] hover:border-[#d4e751] flex items-center justify-center text-[#8e95a0] hover:text-[#d4e751] transition shadow-xs"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#d4e751]' : ''} />
          </button>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="w-8 h-8 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#1e2127] hover:bg-[#251214] hover:border-[#ef4444]/60 flex items-center justify-center text-[#8e95a0] hover:text-[#f87171] transition shadow-xs"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Haulix Top Metric Strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-[10px] font-mono">
          <div className="bg-[#17191d] border border-[rgba(255,255,255,0.08)] rounded-full px-3 py-1 flex items-center gap-1.5 whitespace-nowrap shadow-xs">
            <span className="text-[#8e95a0]">Active Pools:</span>
            <span className="text-white font-bold">{activePools.length} Live</span>
          </div>
          <div className="bg-[#17191d] border border-[rgba(255,255,255,0.08)] rounded-full px-3 py-1 flex items-center gap-1.5 whitespace-nowrap shadow-xs">
            <span className="text-[#8e95a0]">Radar:</span>
            <span className="text-[#d4e751] font-bold">300m Cluster</span>
          </div>
          <div className="bg-[#17191d] border border-[rgba(255,255,255,0.08)] rounded-full px-3 py-1 flex items-center gap-1.5 whitespace-nowrap shadow-xs">
            <span className="text-[#8e95a0]">Fee:</span>
            <span className="text-[#22d3ee] font-bold">Zero Comm.</span>
          </div>
        </div>

        {/* Dark Fleet Radar Map */}
        <div>
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="text-[10px] font-mono font-extrabold text-[#8e95a0] uppercase tracking-wider flex items-center gap-1.5">
              <Navigation size={12} className="text-[#d4e751]" />
              <span>Campus Fleet Radar</span>
            </span>
            <div className="flex items-center gap-1 text-[10px] text-[#d4e751] bg-[#d4e751]/10 border border-[#d4e751]/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4e751] inline-block" />
              <span>300M RADAR CLUSTER</span>
            </div>
          </div>

          <div className="h-52 w-full rounded-2xl overflow-hidden shadow-xl border border-[rgba(255,255,255,0.08)]">
            <MapView
              hubs={hubs}
              destinations={destinations}
              selectedHub={selectedHub}
              selectedDest={selectedDest}
              pools={activePools}
            />
          </div>
        </div>

        {/* Haulix Commute Route Configurator Card */}
        <div className="bg-[#17191d] rounded-3xl p-5 border border-[rgba(255,255,255,0.08)] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
            <div className="text-xs font-black text-white flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#1e2127] text-[#d4e751] flex items-center justify-center font-bold">
                <MapPin size={13} />
              </div>
              <span>Configure Commute Dispatch</span>
            </div>
            <span className="text-[9px] font-mono text-[#8e95a0] font-bold bg-[#1e2127] px-2 py-0.5 rounded border border-[rgba(255,255,255,0.08)]">
              10-MIN WINDOW
            </span>
          </div>

          {/* Pickup Hub Select */}
          <div>
            <label className="block text-[10px] font-mono font-extrabold text-[#8e95a0] uppercase mb-1.5">
              Transit Hub (Gate Pickup)
            </label>
            <div className="relative">
              <select
                value={selectedHubId}
                onChange={(e) => setSelectedHubId(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1e2127] text-white hover:border-[rgba(255,255,255,0.2)] focus:border-[#d4e751] focus:ring-1 focus:ring-[#d4e751] outline-none transition appearance-none"
              >
                {hubs.map((hub) => (
                  <option key={hub.id} value={hub.id} className="bg-[#17191d] text-white">
                    {hub.type === 'METRO' ? '🚊 ' : hub.type === 'BUS' ? '🚌 ' : '🚉 '}
                    {hub.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8e95a0]">
                ▾
              </div>
            </div>
          </div>

          {/* Campus Drop-off Select */}
          <div>
            <label className="block text-[10px] font-mono font-extrabold text-[#8e95a0] uppercase mb-1.5">
              Campus Destination Drop-Off
            </label>
            <div className="relative">
              <select
                value={selectedDestId}
                onChange={(e) => setSelectedDestId(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1e2127] text-white hover:border-[rgba(255,255,255,0.2)] focus:border-[#d4e751] focus:ring-1 focus:ring-[#d4e751] outline-none transition appearance-none"
              >
                {destinations.map((dest) => (
                  <option key={dest.id} value={dest.id} className="bg-[#17191d] text-white">
                    🏫 {dest.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8e95a0]">
                ▾
              </div>
            </div>
          </div>

          {/* Vehicle Capacity (Haulix Fleet Blocks) */}
          <div>
            <label className="block text-[10px] font-mono font-extrabold text-[#8e95a0] uppercase mb-2">
              Vehicle Capacity (Atomic RTO Limits)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* AUTO */}
              <button
                type="button"
                onClick={() => setVehicleType('AUTO')}
                className={`py-3 px-3.5 rounded-2xl border text-left transition-all duration-200 ${
                  vehicleType === 'AUTO'
                    ? 'border-[#d4e751] bg-[#1e231b] text-white shadow-md ring-1 ring-[#d4e751]/50'
                    : 'border-[rgba(255,255,255,0.08)] bg-[#1e2127] text-[#8e95a0] hover:border-[rgba(255,255,255,0.2)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-white flex items-center gap-1.5">
                    <span>🛺</span>
                    <span>Auto</span>
                  </span>
                  <span className="text-[9px] bg-[#27301c] text-[#d4e751] font-mono font-extrabold px-1.5 py-0.5 rounded border border-[#d4e751]/30">
                    Max 3
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#8e95a0] font-mono">
                  <span className="text-[#d4e751]">● ● ●</span>
                  <span>Seats</span>
                </div>
              </button>

              {/* CAB */}
              <button
                type="button"
                onClick={() => setVehicleType('CAB')}
                className={`py-3 px-3.5 rounded-2xl border text-left transition-all duration-200 ${
                  vehicleType === 'CAB'
                    ? 'border-[#22d3ee] bg-[#15252b] text-white shadow-md ring-1 ring-[#22d3ee]/50'
                    : 'border-[rgba(255,255,255,0.08)] bg-[#1e2127] text-[#8e95a0] hover:border-[rgba(255,255,255,0.2)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-white flex items-center gap-1.5">
                    <span>🚕</span>
                    <span>Cab</span>
                  </span>
                  <span className="text-[9px] bg-[#16272e] text-[#22d3ee] font-mono font-extrabold px-1.5 py-0.5 rounded border border-[#22d3ee]/30">
                    Max 4
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#8e95a0] font-mono">
                  <span className="text-[#22d3ee]">● ● ● ●</span>
                  <span>Seats</span>
                </div>
              </button>
            </div>
          </div>

          {/* Women-Only Commute Pool Toggle */}
          <div className="pt-1">
            <div
              onClick={() => setWomenOnly(!womenOnly)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                womenOnly
                  ? 'border-pink-500/60 bg-[#25131f] shadow-md'
                  : 'border-[rgba(255,255,255,0.08)] bg-[#1e2127] hover:border-[rgba(255,255,255,0.2)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                  womenOnly ? 'bg-pink-600 text-white shadow-xs' : 'bg-[#17191d] text-[#8e95a0]'
                }`}>
                  <Shield size={15} />
                </div>
                <div>
                  <div className={`text-xs font-bold ${womenOnly ? 'text-pink-200' : 'text-white'}`}>
                    Women-Only Commute Pool
                  </div>
                  <div className="text-[10px] text-[#8e95a0]">
                    Match exclusively with verified female commuters
                  </div>
                </div>
              </div>

              <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                womenOnly ? 'bg-pink-600' : 'bg-[#17191d]'
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
                  ? 'bg-[#251214] border border-[#ef4444]/60 text-[#fca5a5]'
                  : 'bg-[#122218] border border-[#10b981]/60 text-[#86efac]'
              }`}
            >
              <AlertCircle size={16} className="shrink-0" />
              <span className="font-semibold">{alertMsg.text}</span>
            </div>
          )}

          {/* Haulix Electric Lime CTA Button */}
          <button
            onClick={handleMatchPool}
            disabled={matchingLoading}
            className="w-full py-4 btn-haulix-lime text-xs flex items-center justify-center gap-2 uppercase tracking-wider font-black disabled:opacity-50"
          >
            {matchingLoading ? (
              <>
                <Loader2 size={16} className="animate-spin text-[#0b0c0e]" />
                <span>Running Geospatial Match Engine...</span>
              </>
            ) : (
              <>
                <Zap size={16} className="text-[#0b0c0e]" />
                <span>Initiate Priority Commute Pool</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

        {/* Active Pools Feed (Haulix Convoys) */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-mono font-extrabold text-[#8e95a0] uppercase tracking-wider flex items-center gap-1.5">
              <Users size={12} className="text-[#d4e751]" />
              <span>Active Commute Convoys ({activePools.length})</span>
            </span>
            <span className="text-[10px] font-mono text-[#d4e751]">
              Live 4s sync
            </span>
          </div>

          {activePools.length === 0 ? (
            <div className="bg-[#17191d] border border-dashed border-[rgba(255,255,255,0.08)] rounded-3xl p-8 text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-[#1e2127] border border-[rgba(255,255,255,0.06)] text-[#d4e751] flex items-center justify-center mx-auto text-2xl mb-2.5">
                🛺
              </div>
              <p className="text-xs font-bold text-white">
                No active pools at this hub
              </p>
              <p className="text-[11px] text-[#8e95a0] mt-1 max-w-[240px] mx-auto leading-relaxed">
                Click &quot;Initiate Priority Commute Pool&quot; above to lead the pool!
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
                    className="group bg-[#17191d] border border-[rgba(255,255,255,0.08)] hover:border-[#d4e751] p-4 rounded-2xl shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-white group-hover:text-[#d4e751] transition-colors">
                          {pool.hub.name}
                        </span>
                        <ChevronRight size={13} className="text-[#525866]" />
                        <span className="text-xs font-bold text-[#d4e751]">
                          {pool.destination.name}
                        </span>
                      </div>

                      <span
                        className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded ${
                          isFull
                            ? 'bg-[#251214] text-[#f87171] border border-[#ef4444]/50'
                            : 'bg-[#122218] text-[#10b981] border border-[#10b981]/50'
                        }`}
                      >
                        {isFull ? 'FULL' : `${pool.seatsAvailable} LEFT`}
                      </span>
                    </div>

                    {/* Capacity Telemetry Bar */}
                    <div className="w-full bg-[#1e2127] rounded-full h-1.5 mb-2.5 overflow-hidden">
                      <div
                        className="bg-[#d4e751] h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${percentFilled}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#8e95a0]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">
                          {pool.vehicleType === 'AUTO' ? '🛺 Auto (3)' : '🚕 Cab (4)'}
                        </span>
                        <span>•</span>
                        <span className="font-mono">
                          {pool.members.length}/{pool.maxSeats} Riders
                        </span>
                        {pool.womenOnly && (
                          <>
                            <span>•</span>
                            <span className="text-pink-400 font-bold flex items-center gap-0.5">
                              <Shield size={10} /> Women Pool
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[#d4e751] font-mono font-bold text-xs">
                        {isMyPool ? (
                          <span className="bg-[#1e231b] text-[#d4e751] px-2 py-0.5 rounded font-mono font-bold text-[10px] border border-[#d4e751]/30">
                            You Joined
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
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
