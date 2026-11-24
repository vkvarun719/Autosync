import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AutoSync • Haulix Campus Logistics Fleet',
  description: 'Hyper-local smart campus mobility platform with zero commission, dynamic UPI settlement, and RTO compliance.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0b0c0e',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="bg-[#0b0c0e] text-[#ffffff] antialiased selection:bg-[#d4e751] selection:text-[#0b0c0e] flex items-center justify-center p-0 sm:py-6">
        <main className="w-full max-w-md min-h-screen sm:min-h-[850px] sm:rounded-[2.5rem] bg-[#121417] shadow-2xl shadow-black relative overflow-hidden flex flex-col border border-[rgba(255,255,255,0.08)]">
          {/* Top Haulix Electric Lime Accent Glow */}
          <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#d4e751] to-transparent rounded-full opacity-70 z-50 shadow-sm shadow-[#d4e751]" />
          {children}
        </main>
      </body>
    </html>
  )
}
