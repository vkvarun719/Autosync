'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Hub, Destination, Pool } from '@/types'

// Clean modern map icons with Emerald accents
const createCustomIcon = (symbol: string, isHub: boolean = true) => {
  return L.divIcon({
    className: 'autosync-map-marker',
    html: `
      <div style="
        position: relative;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: ${isHub ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.2)'};
        "></div>
        <div style="
          background: ${isHub ? '#10b981' : '#171a21'};
          color: ${isHub ? '#0f1115' : '#ffffff'};
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0,0,0,0.6), 0 0 0 2px ${isHub ? '#10b981' : '#262b36'};
          position: relative;
          z-index: 2;
          cursor: pointer;
        ">
          ${symbol}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  })
}

const metroIcon = createCustomIcon('🚊', true)
const busIcon = createCustomIcon('🚌', true)
const trainIcon = createCustomIcon('🚉', true)
const campusIcon = createCustomIcon('🏫', false)

function MapFlyTo({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, 14, { duration: 1.0 })
  }, [center, map])
  return null
}

interface MapViewProps {
  hubs: Hub[]
  destinations: Destination[]
  selectedHub?: Hub | null
  selectedDest?: Destination | null
  pools?: Pool[]
  routeCoords?: [number, number][]
}

export default function MapView({
  hubs,
  destinations,
  selectedHub,
  selectedDest,
  pools = [],
  routeCoords
}: MapViewProps) {
  // Bangalore RVITM default center
  const defaultCenter: [number, number] = [12.8731, 77.5789]
  const currentCenter: [number, number] = selectedHub
    ? [selectedHub.lat, selectedHub.lng]
    : selectedDest
    ? [selectedDest.lat, selectedDest.lng]
    : defaultCenter

  const polylineCoords: [number, number][] =
    routeCoords && routeCoords.length > 0
      ? routeCoords
      : selectedHub && selectedDest
      ? [
          [selectedHub.lat, selectedHub.lng],
          [selectedDest.lat, selectedDest.lng],
        ]
      : []

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-[#262b36] shadow-md bg-[#12141a]">
      <MapContainer
        center={currentCenter}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full min-h-[220px]"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapFlyTo center={currentCenter} />

        {/* Pickup Hubs */}
        {hubs.map((hub) => {
          const icon =
            hub.type === 'METRO'
              ? metroIcon
              : hub.type === 'BUS'
              ? busIcon
              : trainIcon
          return (
            <Marker
              key={`hub-${hub.id}`}
              position={[hub.lat, hub.lng]}
              icon={icon}
            >
              <Popup>
                <div>
                  <div className="font-bold text-white text-xs">
                    {hub.name}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                    Pickup Stop • 300m radius
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* Campus Destinations */}
        {destinations.map((dest) => (
          <Marker
            key={`dest-${dest.id}`}
            position={[dest.lat, dest.lng]}
            icon={campusIcon}
          >
            <Popup>
              <div>
                <div className="font-bold text-white text-xs">
                  {dest.name}
                </div>
                <div className="text-[10px] text-sky-400 font-medium mt-0.5">
                  Campus Drop-Off
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route Line in Emerald */}
        {polylineCoords.length === 2 && (
          <>
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#10b981',
                weight: 6,
                opacity: 0.25,
              }}
            />
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#10b981',
                weight: 3,
                dashArray: '5, 8',
                opacity: 0.9,
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-2.5 right-2.5 z-[400] bg-[#171a21]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#262b36] text-[11px] shadow-lg flex items-center gap-3 text-white">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>Pickup Stop</span>
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
          <span>Campus Gate</span>
        </span>
        {pools.length > 0 && (
          <span className="text-emerald-400 font-bold border-l border-[#262b36] pl-2 text-[10px]">
            {pools.length} open {pools.length === 1 ? 'ride' : 'rides'}
          </span>
        )}
      </div>
    </div>
  )
}
