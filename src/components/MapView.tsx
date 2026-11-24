'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Hub, Destination, Pool } from '@/types'

// Setup clean custom icons using divIcon with radar glow and sleek badges
const createCustomIcon = (bgColor: string, iconSymbol: string, title: string, isPulsing: boolean = false) => {
  return L.divIcon({
    className: 'custom-map-marker-container',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        ${
          isPulsing
            ? `<div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${bgColor}; opacity: 0.35; animation: marker-pulse 2s infinite ease-out;"></div>`
            : ''
        }
        <div style="
          background: ${bgColor};
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 700;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25), 0 0 0 2px rgba(255,255,255,0.9);
          position: relative;
          z-index: 2;
          cursor: pointer;
        " title="${title}">
          ${iconSymbol}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  })
}

const metroIcon = createCustomIcon('linear-gradient(135deg, #4f46e5, #3730a3)', '🚊', 'Metro Hub', true)
const busIcon = createCustomIcon('linear-gradient(135deg, #ea580c, #c2410c)', '🚌', 'Bus Station', true)
const transitIcon = createCustomIcon('linear-gradient(135deg, #0284c7, #0369a1)', '🚉', 'Transit Hub', true)
const campusIcon = createCustomIcon('linear-gradient(135deg, #059669, #047857)', '🏫', 'Campus Drop-off')

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
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm">
      <MapContainer
        center={currentCenter}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full min-h-[220px]"
        zoomControl={false}
      >
        {/* CartoDB Voyager tiles for modern classy look */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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
                <div>
                  <div className="font-bold text-white text-xs tracking-tight">
                    {hub.name}
                  </div>
                  <div className="text-[10px] text-indigo-300 uppercase tracking-widest font-semibold mt-0.5">
                    {hub.type} TRANSIT HUB • 300M CLUSTER
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
                <div className="font-bold text-white text-xs tracking-tight">
                  {dest.name}
                </div>
                <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">
                  CAMPUS DROP-OFF ZONE
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route Path Polyline with classy neon aesthetic */}
        {polylineCoords.length === 2 && (
          <>
            {/* Soft Glow Underline */}
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#6366f1',
                weight: 8,
                opacity: 0.25,
              }}
            />
            {/* Crisp Dashed Route Line */}
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#4f46e5',
                weight: 3.5,
                dashArray: '6, 8',
                opacity: 0.95,
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Classy Glass Legend Overlay */}
      <div className="absolute bottom-2.5 right-2.5 z-[400] bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-[10px] shadow-lg flex items-center gap-3 text-white">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-indigo-400 ring-2 ring-indigo-400/40 inline-block animate-pulse" />
          <span>Hub</span>
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>Campus</span>
        </span>
        {pools.length > 0 && (
          <span className="font-semibold text-indigo-300 border-l border-white/20 pl-2">
            {pools.length} Active Pool{pools.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
