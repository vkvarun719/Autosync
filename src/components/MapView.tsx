'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Hub, Destination, Pool } from '@/types'

// Setup clean custom icons using divIcon so there are zero missing image asset errors
const createCustomIcon = (bgColor: string, iconSymbol: string, title: string) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        font-weight: bold;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
      " title="${title}">
        ${iconSymbol}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  })
}

const metroIcon = createCustomIcon('#4f46e5', '🚊', 'Metro Station')
const busIcon = createCustomIcon('#ea580c', '🚌', 'Bus Depot')
const transitIcon = createCustomIcon('#0284c7', '🚉', 'Transit Hub')
const campusIcon = createCustomIcon('#059669', '🏫', 'Campus Destination')

function MapFlyTo({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, 14, { duration: 1.2 })
  }, [center, map])
  return null
}

interface MapViewProps {
  hubs: Hub[]
  destinations: Destination[]
  selectedHub?: Hub | null
  selectedDest?: Destination | null
  pools?: Pool[]
}

export default function MapView({
  hubs,
  destinations,
  selectedHub,
  selectedDest,
  pools = []
}: MapViewProps) {
  const defaultCenter: [number, number] = [28.6142, 77.2095]
  const currentCenter: [number, number] = selectedHub
    ? [selectedHub.lat, selectedHub.lng]
    : selectedDest
    ? [selectedDest.lat, selectedDest.lng]
    : defaultCenter

  const polylineCoords: [number, number][] =
    selectedHub && selectedDest
      ? [
          [selectedHub.lat, selectedHub.lng],
          [selectedDest.lat, selectedDest.lng],
        ]
      : []

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-slate-200">
      <MapContainer
        center={currentCenter}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full min-h-[220px]"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
              : transitIcon
          return (
            <Marker
              key={`hub-${hub.id}`}
              position={[hub.lat, hub.lng]}
              icon={icon}
            >
              <Popup>
                <div className="p-1 font-sans">
                  <div className="font-semibold text-slate-800 text-xs">
                    {hub.name}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                    {hub.type} Transit Hub
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
              <div className="p-1 font-sans">
                <div className="font-semibold text-slate-800 text-xs">
                  {dest.name}
                </div>
                <div className="text-[10px] text-emerald-600 font-medium">
                  Campus Drop-off
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route Path */}
        {polylineCoords.length === 2 && (
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: '#4f46e5',
              weight: 4,
              dashArray: '8, 8',
              opacity: 0.85,
            }}
          />
        )}
      </MapContainer>

      {/* Legend Badge */}
      <div className="absolute bottom-2 right-2 z-[400] bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-slate-200 text-[10px] shadow-sm flex items-center gap-3">
        <span className="flex items-center gap-1 font-medium text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" /> Hub
        </span>
        <span className="flex items-center gap-1 font-medium text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Campus
        </span>
        {pools.length > 0 && (
          <span className="font-semibold text-indigo-600">
            {pools.length} active pool{pools.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
