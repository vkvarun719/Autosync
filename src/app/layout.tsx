import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AutoSync – Hyper-Local Smart Mobility for Campus',
  description: 'Coordinate shared auto-rickshaw and cab commutes from transit hubs to campus with zero commission and RTO compliance.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="bg-slate-100 min-h-screen text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        <main className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative overflow-x-hidden flex flex-col">
          {children}
        </main>
      </body>
    </html>
  )
}
