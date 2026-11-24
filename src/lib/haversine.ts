/**
 * Haversine Geospatial Utility for AutoSync
 * 300m radius clustering & matching logic
 */

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function isWithinRadius(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radiusMeters: number = 300
): boolean {
  return haversineDistance(lat1, lng1, lat2, lng2) <= radiusMeters
}

export interface QueuedRider {
  id: string
  userId: string
  hubId: string
  destinationId: string
  hubLat: number
  hubLng: number
  destLat: number
  destLng: number
  vehicleType: 'AUTO' | 'CAB'
  womenOnly: boolean
  gender: string
  requestedAt: Date
  waitingDurationMs?: number
}

/**
 * Priority Queue comparator prioritizing longest-waiting riders first
 */
export function compareRiderPriority(a: QueuedRider, b: QueuedRider): number {
  return a.requestedAt.getTime() - b.requestedAt.getTime() // earlier timestamp = longer wait = higher priority
}

/**
 * Check if two riders/pools cluster within the 300m pickup radius and compatible dropoff
 */
export function canCluster(
  hub1: { lat: number; lng: number },
  dest1: { lat: number; lng: number },
  hub2: { lat: number; lng: number },
  dest2: { lat: number; lng: number },
  clusterRadiusMeters: number = 300
): boolean {
  const pickupDist = haversineDistance(hub1.lat, hub1.lng, hub2.lat, hub2.lng)
  // Destinations cluster within 500m or same campus zone
  const dropoffDist = haversineDistance(dest1.lat, dest1.lng, dest2.lat, dest2.lng)
  return pickupDist <= clusterRadiusMeters && dropoffDist <= 1000
}
