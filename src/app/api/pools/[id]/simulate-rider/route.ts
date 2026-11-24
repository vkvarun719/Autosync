import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const SIM_NAMES = [
  'Kiran Patel',
  'Rohit Nair',
  'Sneha Reddy',
  'Arjun Mehta',
  'Divya Kumar',
  'Suresh Iyer',
  'Meera Joshi',
]
const SIM_EMAILS_BASE = ['kiran', 'rohit', 'sneha', 'arjun', 'divya', 'suresh', 'meera']
const SIM_GENDER = ['MALE', 'FEMALE', 'FEMALE', 'MALE', 'FEMALE', 'MALE', 'FEMALE']

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pool = await prisma.pool.findUnique({
      where: { id },
      include: { members: true },
    })
    if (!pool) return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
    if (pool.seatsAvailable <= 0) {
      return NextResponse.json({ error: 'Pool is already full' }, { status: 400 })
    }

    const idx = Math.floor(Math.random() * SIM_NAMES.length)
    const timestamp = Date.now().toString().slice(-4)
    const simEmail = `${SIM_EMAILS_BASE[idx]}.${timestamp}@university.edu.in`

    // Create realistic student persona
    const simUser = await prisma.user.create({
      data: {
        email: simEmail,
        name: SIM_NAMES[idx],
        rollId: `22B${Math.floor(1000 + Math.random() * 9000)}`,
        gender: pool.womenOnly ? 'FEMALE' : SIM_GENDER[idx],
        collegeName: 'Delhi Technological University',
        defaultUpiId: `${SIM_EMAILS_BASE[idx]}@okaxis`,
        emergencyContact: '+91-9811223344',
      },
    })

    const result = await prisma.$transaction(async (tx) => {
      const p = await tx.pool.findUnique({ where: { id } })
      if (!p || p.seatsAvailable <= 0) throw new Error('Pool full')

      await tx.pool.update({
        where: { id },
        data: { seatsAvailable: { decrement: 1 } },
      })

      await tx.poolMember.create({
        data: {
          poolId: id,
          userId: simUser.id,
          quickStatus: 'At Gate 2',
        },
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
                  rollId: true,
                  collegeName: true,
                },
              },
            },
          },
        },
      })
    })

    return NextResponse.json({ pool: result, simulatedUser: simUser })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
