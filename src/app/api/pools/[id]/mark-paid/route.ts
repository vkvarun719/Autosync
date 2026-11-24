import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await req.json()
    const member = await prisma.poolMember.findFirst({
      where: { poolId: id, userId },
    })
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const updated = await prisma.poolMember.update({
      where: { id: member.id },
      data: { status: 'PAID', paidAt: new Date() },
    })
    return NextResponse.json({ member: updated })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
