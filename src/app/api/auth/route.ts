import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function isValidCollegeEmail(email: string): boolean {
  return /\.(edu|edu\.in|ac\.in)$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, email, name, rollId, gender, defaultUpiId, emergencyContact, collegeName } = body

    if (action === 'demo-login') {
      const demoEmails = [
        'priya.sharma@university.edu.in',
        'rahul.verma@university.edu.in',
        'ananya.singh@university.edu.in'
      ]
      const persona = demoEmails[body.persona ?? 0]
      const user = await prisma.user.findUnique({ where: { email: persona } })
      if (!user) return NextResponse.json({ error: 'Demo user not found. Run seed first.' }, { status: 404 })
      return NextResponse.json({ user, token: `demo_${user.id}` })
    }

    if (action === 'register') {
      if (!isValidCollegeEmail(email)) {
        return NextResponse.json({ error: 'Must use a college email (.edu, .edu.in, or .ac.in)' }, { status: 400 })
      }
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) return NextResponse.json({ user: existing, token: `auth_${existing.id}` })
      const user = await prisma.user.create({
        data: { email, name: name || email.split('@')[0], rollId: rollId || 'PENDING', gender: gender || 'OTHER', defaultUpiId, emergencyContact, collegeName }
      })
      return NextResponse.json({ user, token: `auth_${user.id}` })
    }

    if (action === 'login') {
      if (!isValidCollegeEmail(email)) {
        return NextResponse.json({ error: 'Must use a college email' }, { status: 400 })
      }
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return NextResponse.json({ error: 'User not found. Please register first.' }, { status: 404 })
      return NextResponse.json({ user, token: `auth_${user.id}` })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, gender: true } })
  return NextResponse.json({ users })
}
