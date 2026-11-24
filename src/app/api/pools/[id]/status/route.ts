import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId, message } = await req.json()

    // Update quick status on member
    await prisma.poolMember.updateMany({
      where: { poolId: id, userId },
      data: { quickStatus: message },
    })

    // Log status update
    await prisma.statusUpdate.create({
      data: { poolId: id, userId, message },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
