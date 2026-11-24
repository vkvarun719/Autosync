import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isWithinRadius, haversineDistance } from '@/lib/haversine'

/**
 * Geospatial Clustering & Priority Queue Matching Engine
 * Commuter selects Pickup Hub, Destination, Vehicle Type (AUTO or CAB), and optional Women-Only Pool filter.
 * Haversine clustering utility (300m radius) + groups riders heading in the same direction within a 10-minute window,
 * prioritizing the longest-waiting riders first.
 * Strict RTO Capacity Guardrails: AUTO = max 3 passengers, CAB = max 4 passengers. Prevent overbooking.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { hubId, destinationId, vehicleType, womenOnly, userId } = body

    if (!hubId || !destinationId || !vehicleType || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // 1. Fetch current user and selected hub/destination
    const [user, targetHub, targetDest] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.hub.findUnique({ where: { id: hubId } }),
      prisma.destination.findUnique({ where: { id: destinationId } })
    ])

    if (!user || !targetHub || !targetDest) {
      return NextResponse.json({ error: 'User, Hub or Destination not found' }, { status: 404 })
    }

    if (womenOnly && user.gender !== 'FEMALE') {
      return NextResponse.json({ error: 'Women-only pool is restricted to female riders' }, { status: 403 })
    }

    const maxSeats = vehicleType === 'AUTO' ? 3 : 4
    const now = new Date()

    // 2. Fetch all active waiting pools with the matching vehicle type
    const potentialPools = await prisma.pool.findMany({
      where: {
        vehicleType,
        status: 'WAITING',
        expiresAt: { gt: now },
        seatsAvailable: { gt: 0 },
        ...(womenOnly ? { womenOnly: true } : {})
      },
      include: {
        hub: true,
        destination: true,
        lead: true,
        members: {
          include: {
            user: true
          }
        }
      },
      // Priority Queue: longest-waiting pools first
      orderBy: {
        createdAt: 'asc'
      }
    })

    // 3. Filter using Haversine 300m radius geospatial clustering
    const matchingPool = potentialPools.find(pool => {
      // Must not already be in this pool
      const alreadyMember = pool.members.some(m => m.userId === userId)
      if (alreadyMember) return false

      // Check pickup hub proximity (within 300m)
      const hubDistance = haversineDistance(
        targetHub.lat,
        targetHub.lng,
        pool.hub.lat,
        pool.hub.lng
      )

      if (hubDistance > 300) return false

      // Check destination proximity (within 1000m or same destination)
      const destDistance = haversineDistance(
        targetDest.lat,
        targetDest.lng,
        pool.destination.lat,
        pool.destination.lng
      )

      if (destDistance > 1000) return false

      // Check Women-Only compatibility
      if (pool.womenOnly && user.gender !== 'FEMALE') return false

      // RTO capacity check
      if (pool.members.length >= pool.maxSeats) return false

      return true
    })

    if (matchingPool) {
      // Join this matched pool atomically with transaction to prevent overbooking
      const updatedPool = await prisma.$transaction(async (tx) => {
        const freshPool = await tx.pool.findUnique({
          where: { id: matchingPool.id },
          include: { members: true }
        })

        if (!freshPool || freshPool.seatsAvailable <= 0 || freshPool.members.length >= freshPool.maxSeats) {
          throw new Error('Seat was just taken, retry')
        }

        await tx.pool.update({
          where: { id: matchingPool.id },
          data: {
            seatsAvailable: { decrement: 1 }
          }
        })

        await tx.poolMember.create({
          data: {
            poolId: matchingPool.id,
            userId,
            status: 'JOINED'
          }
        })

        return tx.pool.findUnique({
          where: { id: matchingPool.id },
          include: {
            hub: true,
            destination: true,
            lead: true,
            members: { include: { user: true } }
          }
        })
      })

      return NextResponse.json({
        matched: true,
        isNew: false,
        pool: updatedPool,
        message: 'Successfully matched with an existing pool!'
      })
    }

    // 4. No matching pool found -> Create a new pool
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minute matching window

    const newPool = await prisma.$transaction(async (tx) => {
      const created = await tx.pool.create({
        data: {
          hubId,
          destinationId,
          vehicleType,
          womenOnly: womenOnly ?? false,
          maxSeats,
          seatsAvailable: maxSeats - 1,
          leadId: userId,
          expiresAt,
          status: 'WAITING'
        }
      })

      await tx.poolMember.create({
        data: {
          poolId: created.id,
          userId,
          status: 'JOINED'
        }
      })

      return tx.pool.findUnique({
        where: { id: created.id },
        include: {
          hub: true,
          destination: true,
          lead: true,
          members: { include: { user: true } }
        }
      })
    })

    return NextResponse.json({
      matched: true,
      isNew: true,
      pool: newPool,
      message: 'Created new pool and waiting for co-riders.'
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
