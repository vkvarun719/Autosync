import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { haversineDistance } from '@/lib/haversine'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { totalFare, splitType } = await req.json()

    const pool = await prisma.pool.findUnique({
      where: { id },
      include: {
        destination: true,
        hub: true,
        members: {
          include: {
            user: { select: { id: true, name: true, defaultUpiId: true } },
          },
        },
      },
    })
    if (!pool) return NextResponse.json({ error: 'Pool not found' }, { status: 404 })

    const memberCount = pool.members.length
    if (memberCount === 0) return NextResponse.json({ error: 'No members in pool' }, { status: 400 })

    const shares: Record<string, number> = {}

    if (splitType === 'EQUAL') {
      const share = Math.round((totalFare / memberCount) * 100) / 100
      pool.members.forEach((m) => {
        shares[m.userId] = share
      })
    } else {
      // Proportional: weight by distance from hub to destination with small random variance for drop-off stop tiers
      const totalDist = pool.members.reduce((sum, _, idx) => {
        // Base distance from hub to campus destination
        const base = haversineDistance(
          pool.hub.lat,
          pool.hub.lng,
          pool.destination.lat,
          pool.destination.lng
        )
        // Weight: e.g. outer gate vs deeper hostel block
        const stopMultiplier = 1 + idx * 0.15
        return sum + base * stopMultiplier
      }, 0)

      pool.members.forEach((m, idx) => {
        const base = haversineDistance(
          pool.hub.lat,
          pool.hub.lng,
          pool.destination.lat,
          pool.destination.lng
        )
        const stopMultiplier = 1 + idx * 0.15
        shares[m.userId] = Math.round(((totalFare * (base * stopMultiplier)) / totalDist) * 100) / 100
      })
    }

    await prisma.pool.update({
      where: { id },
      data: { totalFare, splitType },
    })

    for (const member of pool.members) {
      await prisma.poolMember.update({
        where: { id: member.id },
        data: { shareAmt: shares[member.userId] },
      })
    }

    const updatedPool = await prisma.pool.findUnique({
      where: { id },
      include: {
        hub: true,
        destination: true,
        lead: {
          select: { id: true, name: true, email: true, gender: true, defaultUpiId: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                gender: true,
                defaultUpiId: true,
                rollId: true,
                collegeName: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ pool: updatedPool, shares })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
