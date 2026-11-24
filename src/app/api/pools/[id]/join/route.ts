import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const result = await prisma.$transaction(async (tx) => {
      const pool = await tx.pool.findUnique({
        where: { id },
        include: { members: true },
      })
      if (!pool) throw new Error('Pool not found')
      if (pool.status !== 'WAITING') throw new Error('Pool is not accepting riders')
      if (pool.seatsAvailable <= 0) throw new Error('Pool is full')
      if (new Date(pool.expiresAt) < new Date()) throw new Error('Pool has expired')

      const existing = pool.members.find((m) => m.userId === userId)
      if (existing) throw new Error('Already in pool')

      await tx.pool.update({
        where: { id },
        data: { seatsAvailable: { decrement: 1 } },
      })
      await tx.poolMember.create({
        data: { poolId: id, userId },
      })

      return tx.pool.findUnique({
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
                  collegeName: true,
                  rollId: true,
                },
              },
            },
          },
        },
      })
    })

    return NextResponse.json({ pool: result })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
