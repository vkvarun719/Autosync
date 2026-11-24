import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const hubId = searchParams.get('hubId')
  const destinationId = searchParams.get('destinationId')
  const vehicleType = searchParams.get('vehicleType')
  const womenOnly = searchParams.get('womenOnly') === 'true'

  const where: Record<string, unknown> = {
    status: 'WAITING',
    expiresAt: { gt: new Date() }
  }
  if (hubId) where.hubId = hubId
  if (destinationId) where.destinationId = destinationId
  if (vehicleType) where.vehicleType = vehicleType
  if (womenOnly) where.womenOnly = true

  const pools = await prisma.pool.findMany({
    where,
    include: {
      hub: true,
      destination: true,
      lead: { select: { id: true, name: true, email: true, gender: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, gender: true, defaultUpiId: true } }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  return NextResponse.json({ pools })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { hubId, destinationId, vehicleType, womenOnly, userId } = body

    if (!hubId || !destinationId || !vehicleType || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const maxSeats = vehicleType === 'AUTO' ? 3 : 4
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Check for existing matching pool
    const existing = await prisma.pool.findFirst({
      where: {
        hubId,
        destinationId,
        vehicleType,
        womenOnly: womenOnly ?? false,
        status: 'WAITING',
        seatsAvailable: { gt: 0 },
        expiresAt: { gt: new Date() }
      },
      include: {
        hub: true, destination: true,
        lead: { select: { id: true, name: true, email: true, gender: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, gender: true, defaultUpiId: true } } } }
      },
      orderBy: { createdAt: 'asc' }
    })

    if (existing && existing.seatsAvailable > 0) {
      // Check if user already in this pool
      const alreadyIn = existing.members.find(m => m.userId === userId)
      if (alreadyIn) return NextResponse.json({ pool: existing, joined: false, message: 'Already in this pool' })
      
      // Join existing pool atomically
      const updated = await prisma.$transaction(async (tx) => {
        const pool = await tx.pool.findUnique({ where: { id: existing.id } })
        if (!pool || pool.seatsAvailable <= 0) throw new Error('Pool full')
        await tx.pool.update({ where: { id: existing.id }, data: { seatsAvailable: { decrement: 1 }, leadId: pool.leadId || userId } })
        await tx.poolMember.create({ data: { poolId: existing.id, userId } })
        return tx.pool.findUnique({
          where: { id: existing.id },
          include: {
            hub: true, destination: true,
            lead: { select: { id: true, name: true, email: true, gender: true } },
            members: { include: { user: { select: { id: true, name: true, email: true, gender: true, defaultUpiId: true } } } }
          }
        })
      })
      return NextResponse.json({ pool: updated, joined: true })
    }

    // Create new pool
    const pool = await prisma.$transaction(async (tx) => {
      const newPool = await tx.pool.create({
        data: { hubId, destinationId, vehicleType, womenOnly: womenOnly ?? false, maxSeats, seatsAvailable: maxSeats - 1, leadId: userId, expiresAt }
      })
      await tx.poolMember.create({ data: { poolId: newPool.id, userId } })
      return tx.pool.findUnique({
        where: { id: newPool.id },
        include: {
          hub: true, destination: true,
          lead: { select: { id: true, name: true, email: true, gender: true } },
          members: { include: { user: { select: { id: true, name: true, email: true, gender: true, defaultUpiId: true } } } }
        }
      })
    })

    return NextResponse.json({ pool, joined: true, created: true }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
