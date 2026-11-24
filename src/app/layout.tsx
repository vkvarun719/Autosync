import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AutoSync • Share the auto. Split the fare.',
  description: 'Smart campus ride-sharing for college students. Coordinate shared autos and cabs from transit hubs with zero fees and direct UPI splits.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f1115',
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
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="bg-[#0f1115] text-[#f1f3f7] antialiased selection:bg-[#10b981] selection:text-[#0f1115] min-h-screen flex flex-col font-sans">
        <main className="w-full min-h-screen flex flex-col bg-[#0f1115]">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  )
}
