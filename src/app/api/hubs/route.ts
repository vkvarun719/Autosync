import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const hubs = await prisma.hub.findMany()
  const destinations = await prisma.destination.findMany()
  return NextResponse.json({ hubs, destinations })
}
