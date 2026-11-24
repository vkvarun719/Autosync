'use client'

import React from 'react'

interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export default function AutoSyncLogo({ size = 32, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0 transition-transform duration-200 hover:scale-105"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4/6 h-4/6"
        >
          {/* Synchronized arrows loop */}
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M21 21v-5h-5" />
        </svg>
      </div>
      {showText && (
        <span className="text-xl font-bold tracking-tight text-white">
          AutoSync
        </span>
      )}
    </div>
  )
}
