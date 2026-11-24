'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  Sparkles,
  ShieldCheck,
  Check,
  Navigation,
  IndianRupee,
  Share2,
  Car,
  ChevronRight,
  School
} from 'lucide-react'
import AutoSyncLogo from '@/components/Logo'
import { PICKUP_LOCATIONS, DESTINATION_RVITM, LocationPoint } from '@/lib/locations'
import GoogleRouteMap from '@/components/GoogleRouteMap'
import type { User, Pool } from '@/types'

export default function RVITMDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint>(PICKUP_LOCATIONS[0])
  
  // Distance API states
  const [distanceLoading, setDistanceLoading] = useState(false)
  const [distanceError, setDistanceError] = useState<string | null>(null)
  const [distanceData, setDistanceData] = useState<{
    distanceKm: number
    durationMin: number
    formattedResult: string
    routeGeometry?: [number, number][]
    source: string
    cached?: boolean
  } | null>(null)

  // Ride sharing states
  const [activePools, setActivePools] = useState<Pool[]>([])
  const [vehicleType, setVehicleType] = useState<'AUTO' | 'CAB'>('AUTO')
  const [womenOnly, setWomenOnly] = useState(false)
  const [matchingLoading, setMatchingLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [alertMsg, setAlertMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  // Check auth session
  useEffect(() => {
    const userStr = localStorage.getItem('autosync_user')
    if (!userStr) {
      router.push('/login')
      return
    }
    try {
      const u = JSON.parse(userStr)
      if (!u?.id) throw new Error('Invalid user')
      setCurrentUser(u)
    } catch {
      localStorage.removeItem('autosync_user')
      router.push('/login')
    }
  }, [router])

  // Fetch Distance Matrix to RVITM
  const fetchDistance = useCallback(async (location: LocationPoint) => {
    setDistanceLoading(true)
    setDistanceError(null)

    try {
      const res = await fetch(`/api/distance?locationId=${encodeURIComponent(location.id)}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to calculate distance to RVITM')
      }

      setDistanceData({
        distanceKm: data.distanceKm,
        durationMin: data.durationMin,
        formattedResult: data.formattedResult,
        routeGeometry: data.routeGeometry,
        source: data.source,
        cached: data.cached
      })
    } catch (err: unknown) {
      console.error('Distance calculation error:', err)
      setDistanceError(err instanceof Error ? err.message : 'Error calculating distance')
    } finally {
      setDistanceLoading(false)
    }
  }, [])

  // Initial distance fetch on mount for default selected location
  useEffect(() => {
    fetchDistance(selectedLocation)
  }, [fetchDistance, selectedLocation])

  // Fetch active rides for the selected location
  const fetchPools = useCallback(async () => {
    try {
      const res = await fetch('/api/pools')
      const data = await res.json()
      if (data.pools) {
        // Filter pools relevant to RVITM commute
        setActivePools(data.pools)
      }
    } catch (err) {
      console.error('Failed to fetch pools:', err)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchPools()
    const interval = setInterval(fetchPools, 6000)
    return () => clearInterval(interval)
  }, [fetchPools])

  const handleSelectLocation = (loc: LocationPoint) => {
    if (selectedLocation.id === loc.id && distanceData) return
    setSelectedLocation(loc)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      })
    } catch {}
    localStorage.removeItem('autosync_user')
    localStorage.removeItem('autosync_token')
    router.push('/login')
  }

  // Handle Find or Start Ride
  const handleMatchRide = async () => {
    if (!currentUser) return
    setMatchingLoading(true)
    setAlertMsg(null)

    try {
      // Find hub ID in database matching the selected pickup location
      const hubsRes = await fetch('/api/hubs')
      const hubsData = await hubsRes.json()
      const matchingHub = hubsData.hubs?.find(
        (h: any) => h.id === selectedLocation.id || h.name.toLowerCase().includes(selectedLocation.name.toLowerCase().slice(0, 5))
      ) || hubsData.hubs?.[0]

      const dest = hubsData.destinations?.[0]

      if (!matchingHub || !dest) {
        throw new Error('Hub configuration missing in database')
      }

      const res = await fetch('/api/pools/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hubId: matchingHub.id,
          destinationId: dest.id,
          vehicleType,
          womenOnly,
          userId: currentUser.id
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to match or create ride')

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

  // Calculate student fare estimate based on distance (Bangalore Auto: base ₹30 for first 2 km, ₹15/km after)
  const distanceKm = distanceData?.distanceKm || 5.0
  const totalAutoFare = Math.max(30, Math.round(30 + Math.max(0, distanceKm - 2) * 15))
  const splitFor3 = Math.ceil(totalAutoFare / 3)
  const splitFor2 = Math.ceil(totalAutoFare / 2)
  const splitFor4 = Math.ceil(Math.round(totalAutoFare * 1.3) / 4) // Cab fare estimate

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#f1f3f7] flex flex-col selection:bg-emerald-500 selection:text-[#0f1115]">
      {/* 1. Header Navbar */}
      <header className="w-full border-b border-[#262b36] sticky top-0 z-40 bg-[#0f1115]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AutoSyncLogo size={32} />
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold">
              <ShieldCheck size={12} />
              <span>RVITM Commute</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#171a21] border border-[#262b36] py-1.5 px-3 rounded-xl text-xs">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold flex items-center justify-center text-xs">
                {currentUser?.name?.charAt(0) || 'R'}
              </span>
              <div className="text-left hidden sm:block">
                <span className="font-semibold text-white block text-xs leading-none">{currentUser?.name}</span>
                <span className="text-[10px] text-[#848b9c]">{currentUser?.email}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setRefreshing(true)
                fetchPools()
                fetchDistance(selectedLocation)
              }}
              title="Refresh"
              className="w-10 h-10 rounded-xl border border-[#262b36] bg-[#171a21] hover:bg-[#1c202a] text-[#9aa1b2] hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin text-emerald-400' : ''} />
            </button>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="w-10 h-10 rounded-xl border border-[#262b36] bg-[#171a21] hover:bg-red-950/40 hover:border-red-500/40 text-[#9aa1b2] hover:text-red-400 flex items-center justify-center transition cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Commuter Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full flex-1 space-y-6">
        
        {/* Step 3: Fixed Destination Banner at the top */}
        <div className="w-full bg-[#171a21] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <School size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Fixed Destination
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-[#848b9c]">College Campus</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                {DESTINATION_RVITM.name}
              </h2>
              <p className="text-xs text-[#9aa1b2]">
                {DESTINATION_RVITM.area} • Coordinates: {DESTINATION_RVITM.lat.toFixed(4)}, {DESTINATION_RVITM.lng.toFixed(4)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-center justify-end">
            <span className="text-xs px-3 py-1.5 rounded-lg border border-[#262b36] bg-[#0f1115] text-[#9aa1b2] font-medium">
              📍 All rides terminate at RVITM
            </span>
          </div>
        </div>

        {/* Step 3: 6 Fixed Pickup Locations as Large Tappable Cards (Mobile-First) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Navigation size={16} className="text-emerald-400" />
              <span>Select Your Pickup Point (Tap to calculate distance)</span>
            </h3>
            <span className="text-xs text-[#848b9c]">6 Fixed Campus Hubs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PICKUP_LOCATIONS.map((loc) => {
              const isSelected = selectedLocation.id === loc.id

              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelectLocation(loc)}
                  className={`w-full min-h-[76px] p-4 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500/40'
                      : 'border-[#262b36] bg-[#171a21] hover:border-[#3a4253] hover:bg-[#1c202a]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-500 text-[#0f1115] font-bold'
                          : 'bg-[#0f1115] border border-[#262b36] text-emerald-400 group-hover:border-emerald-500/40'
                      }`}
                    >
                      <MapPin size={18} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-[#f1f3f7]'}`}>
                          {loc.name}
                        </span>
                        {loc.type === 'METRO' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                            Metro
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#848b9c] block mt-0.5">
                        {loc.area}
                      </span>
                    </div>
                  </div>

                  <div className="pl-2">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-[#0f1115] flex items-center justify-center">
                        <Check size={14} className="stroke-[3]" />
                      </div>
                    ) : (
                      <ChevronRight size={16} className="text-[#555d6e] group-hover:text-white transition" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Step 4: Distance & Travel Time Result Card */}
        <section className="space-y-4">
          {distanceLoading ? (
            <div className="w-full bg-[#171a21] border border-[#262b36] rounded-2xl p-6 text-center space-y-2">
              <Loader2 size={24} className="animate-spin text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-white">Calculating driving route to RVITM...</p>
              <p className="text-xs text-[#848b9c]">Querying server Distance API</p>
            </div>
          ) : distanceError ? (
            <div className="w-full bg-red-950/40 border border-red-500/50 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-200">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="shrink-0 text-red-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Route computation error</h4>
                  <p className="text-xs text-red-300 mt-0.5">{distanceError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fetchDistance(selectedLocation)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : distanceData ? (
            <div className="w-full bg-[#171a21] border border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262b36] pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      Distance Matrix Result
                    </span>
                    {distanceData.cached && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#262b36] text-[#9aa1b2]">
                        24h Cached
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      {distanceData.source === 'google_distance_matrix'
                        ? 'Google Distance Matrix'
                        : distanceData.source === 'osrm_open_source'
                        ? 'Open Source Routing Engine'
                        : 'Road Network Model'}
                    </span>
                  </div>

                  {/* Clear Result Requirement: "Gottigere → RVITM: 6.2 km • ~18 min" */}
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {distanceData.formattedResult}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-[#0f1115] border border-[#262b36] rounded-xl px-4 py-2 text-center">
                    <span className="text-[10px] text-[#848b9c] uppercase font-bold block">Distance</span>
                    <span className="text-base font-extrabold text-emerald-400">{distanceData.distanceKm} km</span>
                  </div>
                  <div className="bg-[#0f1115] border border-[#262b36] rounded-xl px-4 py-2 text-center">
                    <span className="text-[10px] text-[#848b9c] uppercase font-bold block">Est. Time</span>
                    <span className="text-base font-extrabold text-white">~{distanceData.durationMin} min</span>
                  </div>
                </div>
              </div>

              {/* Step 5: Suggested Equal Fare Split based on Distance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-[#0f1115] border border-[#262b36] rounded-xl p-3 text-center">
                  <span className="text-xs text-[#848b9c] block font-medium">3 Riders (Auto)</span>
                  <span className="text-lg font-black text-emerald-400 mt-0.5 block">
                    ₹{splitFor3} <span className="text-xs font-normal text-[#848b9c]">/ student</span>
                  </span>
                  <span className="text-[10px] text-[#6b7280]">Total auto fare: ₹{totalAutoFare}</span>
                </div>

                <div className="bg-[#0f1115] border border-[#262b36] rounded-xl p-3 text-center">
                  <span className="text-xs text-[#848b9c] block font-medium">2 Riders (Auto)</span>
                  <span className="text-lg font-black text-white mt-0.5 block">
                    ₹{splitFor2} <span className="text-xs font-normal text-[#848b9c]">/ student</span>
                  </span>
                  <span className="text-[10px] text-[#6b7280]">Total auto fare: ₹{totalAutoFare}</span>
                </div>

                <div className="bg-[#0f1115] border border-[#262b36] rounded-xl p-3 text-center">
                  <span className="text-xs text-[#848b9c] block font-medium">4 Riders (Cab)</span>
                  <span className="text-lg font-black text-amber-400 mt-0.5 block">
                    ₹{splitFor4} <span className="text-xs font-normal text-[#848b9c]">/ student</span>
                  </span>
                  <span className="text-[10px] text-[#6b7280]">Equal UPI split • ₹0 platform fee</span>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {/* Two-Column Grid: Left = Ride Matching & Open Pools | Right = Google Route Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
          
          {/* Left Column (5 cols): Ride Actions */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Start / Join Ride Card */}
            <div className="rounded-2xl border border-[#262b36] bg-[#171a21] p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Start or Join Ride to RVITM
                </h3>
                <p className="text-xs text-[#848b9c] mt-0.5">
                  Ride starts from <strong className="text-white">{selectedLocation.name}</strong> to RVITM campus.
                </p>
              </div>

              {/* Ride Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#9aa1b2] mb-2">
                  Select Ride Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVehicleType('AUTO')}
                    className={`p-3.5 rounded-xl border text-left transition duration-150 cursor-pointer ${
                      vehicleType === 'AUTO'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-xs'
                        : 'border-[#262b36] bg-[#0f1115] text-[#9aa1b2] hover:border-[#363d4d]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">🛺 Shared Auto</span>
                      <span className="text-[10px] font-semibold text-emerald-400">Max 3</span>
                    </div>
                    <span className="text-[11px] text-[#9aa1b2] block">₹{splitFor3} per rider</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVehicleType('CAB')}
                    className={`p-3.5 rounded-xl border text-left transition duration-150 cursor-pointer ${
                      vehicleType === 'CAB'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-xs'
                        : 'border-[#262b36] bg-[#0f1115] text-[#9aa1b2] hover:border-[#363d4d]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">🚕 Shared Cab</span>
                      <span className="text-[10px] font-semibold text-emerald-400">Max 4</span>
                    </div>
                    <span className="text-[11px] text-[#9aa1b2] block">₹{splitFor4} per rider</span>
                  </button>
                </div>
              </div>

              {/* Women-Only Ride Switch */}
              <div
                onClick={() => setWomenOnly(!womenOnly)}
                className={`p-3.5 rounded-xl border cursor-pointer transition duration-150 flex items-center justify-between ${
                  womenOnly
                    ? 'border-pink-500/60 bg-pink-950/20'
                    : 'border-[#262b36] bg-[#0f1115] hover:border-[#363d4d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      womenOnly ? 'bg-pink-500/20 text-pink-400' : 'bg-[#171a21] text-[#9aa1b2]'
                    }`}
                  >
                    <Shield size={16} />
                  </div>
                  <div>
                    <div className={`text-xs font-semibold ${womenOnly ? 'text-pink-300' : 'text-white'}`}>
                      Women-only ride
                    </div>
                    <div className="text-[11px] text-[#9aa1b2]">
                      Match with RVITM female students only
                    </div>
                  </div>
                </div>

                <div
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition duration-150 ${
                    womenOnly ? 'bg-pink-500' : 'bg-[#262b36]'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full transition-transform duration-150 ${
                      womenOnly ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Alert Message */}
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
                onClick={handleMatchRide}
                disabled={matchingLoading}
                className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0f1115] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition duration-150 disabled:opacity-50 cursor-pointer"
              >
                {matchingLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-[#0f1115]" />
                    <span>Matching RVITM Riders...</span>
                  </>
                ) : (
                  <>
                    <span>Start or Join Ride</span>
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
                  <span>Active RVITM Rides ({activePools.length})</span>
                </span>
                <span className="text-[11px] text-[#848b9c]">Auto-updates</span>
              </div>

              {activePools.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#848b9c] space-y-1">
                  <p className="font-semibold text-white">No active rides right now</p>
                  <p className="text-[11px]">Tap &quot;Start or Join Ride&quot; above to create the first ride pool!</p>
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
                            {pool.hub.name} ➔ RVITM
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

                        <div className="flex items-center justify-between text-xs text-[#848b9c]">
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
                            {isMyPool ? 'Joined' : 'Join'} <ChevronRight size={13} />
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (7 cols): Google Route Map */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-[#262b36] bg-[#171a21] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Navigation size={16} className="text-emerald-400" />
                    <span>Commute Route to RVITM</span>
                  </h3>
                  <p className="text-xs text-[#848b9c]">
                    Pickup: <strong className="text-white">{selectedLocation.name}</strong> ➔ Campus Gate
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${selectedLocation.lat},${selectedLocation.lng}&destination=${DESTINATION_RVITM.lat},${DESTINATION_RVITM.lng}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open live navigation in Google Maps"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition shadow-sm cursor-pointer"
                  >
                    <Navigation size={13} />
                    <span>Open in Google Maps</span>
                    <span className="text-[11px]">↗</span>
                  </a>

                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block">
                      {distanceData?.distanceKm ? `${distanceData.distanceKm} km` : '...'}
                    </span>
                    <span className="text-[10px] text-[#848b9c]">
                      ~{distanceData?.durationMin || '...'} min drive
                    </span>
                  </div>
                </div>
              </div>

              {/* Map Container */}
              <div className="h-[420px] lg:h-[500px] w-full rounded-xl overflow-hidden border border-[#262b36]">
                <GoogleRouteMap
                  pickup={selectedLocation}
                  destination={DESTINATION_RVITM}
                  routeGeometry={distanceData?.routeGeometry}
                  distanceKm={distanceData?.distanceKm}
                  durationMin={distanceData?.durationMin}
                />
              </div>

              {/* Bottom Telemetry Strip */}
              <div className="p-3 rounded-xl border border-[#262b36] bg-[#0f1115] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#848b9c]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Equal UPI Split: ₹{splitFor3} each for 3 auto riders</span>
                </div>
                <span className="text-emerald-400 font-medium text-[11px]">
                  Zero platform commission
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
