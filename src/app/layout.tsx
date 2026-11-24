import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AutoSync • Hyper-Local Smart Campus Mobility',
  description: 'Coordinate shared auto-rickshaw and cab commutes from transit hubs to campus with zero commission and RTO compliance.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4f46e5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-screen text-slate-900 antialiased selection:bg-indigo-600 selection:text-white flex items-center justify-center p-0 sm:py-6">
        <main className="w-full max-w-md min-h-screen sm:min-h-[840px] sm:rounded-[2.5rem] bg-white shadow-2xl shadow-slate-950/20 relative overflow-hidden flex flex-col border border-slate-200/80">
          {children}
        </main>
      </body>
    </html>
  )
}
