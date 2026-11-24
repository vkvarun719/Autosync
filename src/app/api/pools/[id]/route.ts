import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pool = await prisma.pool.findUnique({
      where: { id },
      include: {
        hub: true,
        destination: true,
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            gender: true,
            defaultUpiId: true,
          },
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
                emergencyContact: true,
              },
            },
          },
        },
      },
    })
    if (!pool) return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
    return NextResponse.json({ pool })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { vehicleNumber, sosTriggered, status, leadId } = body

    const updateData: Record<string, unknown> = {}
    if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber
    if (sosTriggered !== undefined) updateData.sosTriggered = sosTriggered
    if (status !== undefined) updateData.status = status
    if (leadId !== undefined) updateData.leadId = leadId

    const pool = await prisma.pool.update({
      where: { id },
      data: updateData,
      include: {
        hub: true,
        destination: true,
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            gender: true,
            defaultUpiId: true,
          },
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
    return NextResponse.json({ pool })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
