'use client'

import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, MapPin, Navigation } from 'lucide-react'
import type { LocationPoint } from '@/lib/locations'

// Dynamically import Leaflet MapView as standard fallback
const LeafletMapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[320px] bg-[#12141a] rounded-2xl flex flex-col items-center justify-center text-[#9aa1b2] text-xs gap-2 border border-[#262b36]">
      <Loader2 size={22} className="animate-spin text-emerald-400" />
      <span>Loading route map...</span>
    </div>
  ),
})

interface GoogleRouteMapProps {
  pickup: LocationPoint | null
  destination: LocationPoint
  routeGeometry?: [number, number][]
  distanceKm?: number | null
  durationMin?: number | null
}

declare global {
  interface Window {
    google?: any
    initGoogleMapCallback?: () => void
  }
}

export default function GoogleRouteMap({
  pickup,
  destination,
  routeGeometry,
  distanceKm,
  durationMin
}: GoogleRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const browserKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY?.trim()
  const [googleLoaded, setGoogleLoaded] = useState(false)
  const [googleLoadError, setGoogleLoadError] = useState(false)

  // Load Google Maps JavaScript API if browser key is supplied
  useEffect(() => {
    if (!browserKey) return

    if (window.google?.maps) {
      setGoogleLoaded(true)
      return
    }

    const scriptId = 'google-maps-script'
    if (document.getElementById(scriptId)) {
      setGoogleLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://maps.googleapis.com/maps/api/js?key=${browserKey}&libraries=places,geometry`
    script.async = true
    script.defer = true
    script.onload = () => setGoogleLoaded(true)
    script.onerror = () => {
      console.warn('Google Maps JS API failed to load (check key or referrer restriction). Using Leaflet fallback.')
      setGoogleLoadError(true)
    }
    document.head.appendChild(script)
  }, [browserKey])

  // Render Google Map with Directions Service when available
  useEffect(() => {
    if (!googleLoaded || googleLoadError || !mapRef.current || !window.google?.maps) return

    try {
      const center = pickup
        ? { lat: (pickup.lat + destination.lat) / 2, lng: (pickup.lng + destination.lng) / 2 }
        : { lat: destination.lat, lng: destination.lng }

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: pickup ? 13 : 14,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#171a21' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1115' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#9aa1b2' }] },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#262b36' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#1e232d' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#10b981' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#0b0d11' }]
          }
        ]
      })

      // Destination Marker (RVITM)
      new window.google.maps.Marker({
        position: { lat: destination.lat, lng: destination.lng },
        map,
        title: destination.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      })

      if (pickup) {
        // Pickup Marker
        new window.google.maps.Marker({
          position: { lat: pickup.lat, lng: pickup.lng },
          map,
          title: pickup.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#38bdf8',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        })

        // Route with DirectionsService
        const directionsService = new window.google.maps.DirectionsService()
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#10b981',
            strokeOpacity: 0.85,
            strokeWeight: 4
          }
        })

        directionsService.route(
          {
            origin: { lat: pickup.lat, lng: pickup.lng },
            destination: { lat: destination.lat, lng: destination.lng },
            travelMode: window.google.maps.TravelMode.DRIVING
          },
          (result: any, status: any) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              directionsRenderer.setDirections(result)
            }
          }
        )
      }
    } catch (e) {
      console.warn('Google Map rendering error, fallback active:', e)
      setGoogleLoadError(true)
    }
  }, [googleLoaded, googleLoadError, pickup, destination])

  // Fallback to Leaflet if no browser key is set or failed to load
  if (!browserKey || googleLoadError) {
    const leafletHubs = pickup
      ? [
          {
            id: pickup.id,
            name: pickup.name,
            type: pickup.type,
            lat: pickup.lat,
            lng: pickup.lng,
            radiusM: 300,
            activeCount: 1
          }
        ]
      : []

    const leafletDests = [
      {
        id: destination.id,
        name: destination.name,
        lat: destination.lat,
        lng: destination.lng,
        radiusM: 500
      }
    ]

    return (
      <div className="w-full h-full relative">
        <LeafletMapView
          hubs={leafletHubs as any}
          destinations={leafletDests as any}
          selectedHub={leafletHubs[0] as any}
          selectedDest={leafletDests[0] as any}
          routeCoords={routeGeometry}
        />
        {!browserKey && (
          <div className="absolute bottom-2.5 right-2.5 z-[1000] px-2.5 py-1 rounded-md bg-[#0f1115]/90 border border-[#262b36] text-[10px] text-[#9aa1b2]">
            OpenStreetMap Engine • Set <code className="text-emerald-400">NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY</code> for Google Maps JS
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-[#262b36]">
      <div ref={mapRef} className="w-full h-full min-h-[360px]" />
      <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md bg-[#0f1115]/85 border border-[#262b36] text-[10px] font-semibold text-emerald-400 flex items-center gap-1.5 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Google Maps JS API</span>
      </div>
    </div>
  )
}
