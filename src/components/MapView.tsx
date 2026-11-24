'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Hub, Destination, Pool } from '@/types'

// Setup clean custom icons using Haulix Electric Lime & Dark accents
const createHaulixIcon = (iconSymbol: string, title: string, isAccent: boolean = false) => {
  return L.divIcon({
    className: 'haulix-map-marker-container',
    html: `
      <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: ${isAccent ? '#d4e751' : '#22d3ee'};
          opacity: 0.25;
          animation: haulix-lime-pulse 2.2s infinite ease-out;
        "></div>
        <div style="
          background: ${isAccent ? '#d4e751' : '#1e2127'};
          color: ${isAccent ? '#0b0c0e' : '#ffffff'};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 800;
          box-shadow: 0 4px 16px rgba(0,0,0,0.8), 0 0 0 2px ${isAccent ? '#d4e751' : 'rgba(255,255,255,0.15)'};
          position: relative;
          z-index: 2;
          cursor: pointer;
        " title="${title}">
          ${iconSymbol}
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  })
}

const metroIcon = createHaulixIcon('🚊', 'Transit Hub (Metro)', true)
const busIcon = createHaulixIcon('🚌', 'Bus Depot Hub', true)
const transitIcon = createHaulixIcon('🚉', 'Transit Gate', true)
const campusIcon = createHaulixIcon('🏫', 'Campus Drop-Off', false)

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
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] shadow-md bg-[#15171b]">
      <MapContainer
        center={currentCenter}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full min-h-[220px]"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
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
                  <div className="font-extrabold text-[#ffffff] text-xs tracking-tight">
                    {hub.name}
                  </div>
                  <div className="text-[10px] text-[#d4e751] uppercase tracking-widest font-mono font-bold mt-0.5">
                    {hub.type} HUB • 300M RADAR
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
                <div className="font-extrabold text-[#ffffff] text-xs tracking-tight">
                  {dest.name}
                </div>
                <div className="text-[10px] text-[#22d3ee] font-bold mt-0.5 uppercase tracking-wide">
                  CAMPUS DROP-OFF ZONE
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route Path Polyline with Haulix Electric Lime Glow */}
        {polylineCoords.length === 2 && (
          <>
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#d4e751',
                weight: 7,
                opacity: 0.2,
              }}
            />
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#d4e751',
                weight: 3.5,
                dashArray: '6, 8',
                opacity: 0.95,
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Haulix Telemetry Legend Overlay */}
      <div className="absolute bottom-2.5 right-2.5 z-[400] bg-[#17191d]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-[10px] shadow-xl flex items-center gap-3 text-[#ffffff]">
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#d4e751] ring-2 ring-[#d4e751]/30 inline-block animate-pulse" />
          <span>Transit Hub</span>
        </span>
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#22d3ee] inline-block" />
          <span>Campus</span>
        </span>
        {pools.length > 0 && (
          <span className="font-mono font-bold text-[#d4e751] border-l border-[rgba(255,255,255,0.1)] pl-2">
            {pools.length} LIVE POOL{pools.length > 1 ? 'S' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
