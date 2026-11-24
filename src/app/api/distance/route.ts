import { NextRequest, NextResponse } from 'next/server'
import { PICKUP_LOCATIONS, DESTINATION_RVITM, getLocationById } from '@/lib/locations'

interface DistanceCacheItem {
  timestamp: number
  distanceKm: number
  durationMin: number
  formattedResult: string
  routeGeometry?: [number, number][]
  source: string
}

// 24-hour server-side in-memory cache per location ID
const distanceCache = new Map<string, DistanceCacheItem>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// Deterministic Haversine with Bangalore road tortuosity factor (~1.35)
function calculateFallbackDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distanceKm: number; durationMin: number } {
  const R = 6371 // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const straightLine = R * c

  // Bangalore urban road network winding factor is roughly 1.35x
  const roadDistance = Math.max(1.0, Number((straightLine * 1.35).toFixed(1)))
  // Average Bangalore auto speed ~22 km/h + 3 min buffer
  const durationMin = Math.max(5, Math.round((roadDistance / 22) * 60 + 3))

  return { distanceKm: roadDistance, durationMin }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId')

    if (!locationId) {
      return NextResponse.json(
        { error: 'Missing locationId query parameter.' },
        { status: 400 }
      )
    }

    // Validate location ID against RVITM allowed list
    const pickup = getLocationById(locationId)
    if (!pickup) {
      return NextResponse.json(
        {
          error: `Invalid pickup location "${locationId}". Must be one of the 6 RVITM fixed pickup hubs.`
        },
        { status: 400 }
      )
    }

    // 1. Check 24-hour Cache
    const cached = distanceCache.get(locationId)
    const now = Date.now()
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        pickup,
        destination: DESTINATION_RVITM,
        distanceKm: cached.distanceKm,
        durationMin: cached.durationMin,
        formattedResult: cached.formattedResult,
        routeGeometry: cached.routeGeometry,
        source: cached.source,
        cached: true,
        cachedAt: new Date(cached.timestamp).toISOString()
      })
    }

    let distanceKm: number | null = null
    let durationMin: number | null = null
    let source = 'fallback'
    let routeGeometry: [number, number][] | undefined = undefined

    // 2. Try Google Distance Matrix API if GOOGLE_MAPS_API_KEY is configured
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim()
    if (googleApiKey && googleApiKey.length > 5) {
      try {
        const googleUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${pickup.lat},${pickup.lng}&destinations=${DESTINATION_RVITM.lat},${DESTINATION_RVITM.lng}&mode=driving&units=metric&key=${googleApiKey}`
        const googleRes = await fetch(googleUrl, { signal: AbortSignal.timeout(5000) })

        if (googleRes.ok) {
          const googleData = await googleRes.json()
          if (
            googleData.status === 'OK' &&
            googleData.rows?.[0]?.elements?.[0]?.status === 'OK'
          ) {
            const element = googleData.rows[0].elements[0]
            distanceKm = Number((element.distance.value / 1000).toFixed(1))
            durationMin = Math.max(1, Math.round(element.duration.value / 60))
            source = 'google_distance_matrix'
          }
        }
      } catch (err) {
        console.warn('[Distance API] Google Distance Matrix request failed, trying fallback:', err)
      }
    }

    // 3. Try Free Open Source Routing API (OSRM) if Google API key was not used or failed
    if (distanceKm === null) {
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${DESTINATION_RVITM.lng},${DESTINATION_RVITM.lat}?overview=full&geometries=geojson`
        const osrmRes = await fetch(osrmUrl, {
          headers: { 'User-Agent': 'AutoSync-RVITM/1.0' },
          signal: AbortSignal.timeout(6000)
        })

        if (osrmRes.ok) {
          const osrmData = await osrmRes.json()
          if (osrmData.routes && osrmData.routes.length > 0) {
            const primaryRoute = osrmData.routes[0]
            distanceKm = Number((primaryRoute.distance / 1000).toFixed(1))
            // Account for Bangalore traffic factor (OSRM raw duration is free-flow)
            const rawMinutes = Math.round(primaryRoute.duration / 60)
            durationMin = Math.max(5, Math.round(rawMinutes * 1.35))
            source = 'osrm_open_source'

            if (primaryRoute.geometry?.coordinates) {
              // Convert [lng, lat] to [lat, lng]
              routeGeometry = primaryRoute.geometry.coordinates.map(
                (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
              )
            }
          }
        }
      } catch (err) {
        console.warn('[Distance API] Free OSRM routing failed, using calibrated road model:', err)
      }
    }

    // 4. Calibrated Road Network Fallback if external APIs fail
    if (distanceKm === null || durationMin === null) {
      const fallback = calculateFallbackDistance(
        pickup.lat,
        pickup.lng,
        DESTINATION_RVITM.lat,
        DESTINATION_RVITM.lng
      )
      distanceKm = fallback.distanceKm
      durationMin = fallback.durationMin
      source = 'calibrated_road_model'
    }

    const formattedResult = `${pickup.name} → RVITM: ${distanceKm} km • ~${durationMin} min`

    // Save to 24h cache
    distanceCache.set(locationId, {
      timestamp: now,
      distanceKm,
      durationMin,
      formattedResult,
      routeGeometry,
      source
    })

    return NextResponse.json({
      success: true,
      pickup,
      destination: DESTINATION_RVITM,
      distanceKm,
      durationMin,
      formattedResult,
      routeGeometry,
      source,
      cached: false
    })
  } catch (error) {
    console.error('[Distance API Error]:', error)
    return NextResponse.json(
      { error: 'Failed to compute route to RVITM. Please try again.' },
      { status: 500 }
    )
  }
}
