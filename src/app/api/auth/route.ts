import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

function getAllowedDomain(): string {
  return (process.env.ALLOWED_EMAIL_DOMAIN || 'rvitm.edu.in').toLowerCase().trim()
}

function isValidRvitmEmail(email: string): boolean {
  const domain = getAllowedDomain()
  const cleanEmail = email.toLowerCase().trim()
  return cleanEmail.endsWith(`@${domain}`)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, email, otp } = body
    const domain = getAllowedDomain()

    // 1. Send OTP Action with Rate Limiting (Max 5 attempts / hour)
    if (action === 'send-otp') {
      if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: 'Please enter your email.' }, { status: 400 })
      }

      const cleanEmail = email.toLowerCase().trim()

      if (!isValidRvitmEmail(cleanEmail)) {
        return NextResponse.json(
          { error: `Please use your RVITM college email (@${domain}).` },
          { status: 400 }
        )
      }

      // Rate limit check: max 5 requests per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const attemptsCount = await prisma.otpVerification.count({
        where: {
          email: cleanEmail,
          createdAt: { gte: oneHourAgo }
        }
      })

      if (attemptsCount >= 5) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Maximum 5 OTP attempts per hour.' },
          { status: 429 }
        )
      }

      // Generate secure 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      await prisma.otpVerification.create({
        data: {
          email: cleanEmail,
          otp: generatedOtp,
          expiresAt
        }
      })

      // In server console
      console.log(`\n======================================================`)
      console.log(`[RVITM AUTH] 6-digit OTP for ${cleanEmail}: ${generatedOtp}`)
      console.log(`[RVITM AUTH] Expires in 10 minutes: ${expiresAt.toLocaleTimeString()}`)
      console.log(`======================================================\n`)

      return NextResponse.json({
        success: true,
        message: `6-digit OTP sent to ${cleanEmail}. Valid for 10 minutes.`,
        devOtp: process.env.NODE_ENV !== 'production' ? generatedOtp : undefined
      })
    }

    // 2. Verify OTP Action & Session Creation
    if (action === 'verify-otp') {
      if (!email || !otp) {
        return NextResponse.json({ error: 'Email and 6-digit OTP are required.' }, { status: 400 })
      }

      const cleanEmail = email.toLowerCase().trim()
      const cleanOtp = otp.toString().trim()

      if (!isValidRvitmEmail(cleanEmail)) {
        return NextResponse.json(
          { error: `Please use your RVITM college email (@${domain}).` },
          { status: 400 }
        )
      }

      // Verify OTP against active database records
      const verificationRecord = await prisma.otpVerification.findFirst({
        where: {
          email: cleanEmail,
          otp: cleanOtp,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      })

      if (!verificationRecord) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP. Please check and try again.' },
          { status: 400 }
        )
      }

      // Clean up used OTP
      await prisma.otpVerification.delete({
        where: { id: verificationRecord.id }
      }).catch(() => {})

      // Find or create RVITM student user
      let user = await prisma.user.findUnique({ where: { email: cleanEmail } })
      if (!user) {
        const username = cleanEmail.split('@')[0].replace(/[._-]/g, ' ')
        const formattedName = username
          .split(' ')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ')

        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: formattedName || 'RVITM Student',
            rollId: '1RVITM',
            gender: 'OTHER',
            collegeName: 'R V Institute of Technology and Management',
            defaultUpiId: `${cleanEmail.split('@')[0]}@okhdfc`
          }
        })
      }

      // Create cryptographically secure session token
      const sessionToken = crypto.randomUUID()
      const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      await prisma.session.create({
        data: {
          token: sessionToken,
          userId: user.id,
          expiresAt: sessionExpiry
        }
      })

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          rollId: user.rollId,
          collegeName: user.collegeName
        }
      })

      // Set httpOnly session cookie
      response.cookies.set('autosync_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      })

      return response
    }

    // 3. Demo Persona Instant Login (Pre-seeded RVITM students)
    if (action === 'demo-login') {
      const demoEmails = [
        `priya.sharma@${domain}`,
        `rahul.verma@${domain}`,
        `ananya.singh@${domain}`
      ]
      const personaEmail = demoEmails[body.persona ?? 0]
      let user = await prisma.user.findUnique({ where: { email: personaEmail } })

      if (!user) {
        // Fallback create demo user if seed was modified
        user = await prisma.user.create({
          data: {
            email: personaEmail,
            name: body.persona === 0 ? 'Priya Sharma' : body.persona === 1 ? 'Rahul Verma' : 'Ananya Singh',
            rollId: '1RV21CS085',
            gender: body.persona === 1 ? 'MALE' : 'FEMALE',
            collegeName: 'R V Institute of Technology and Management'
          }
        })
      }

      const sessionToken = crypto.randomUUID()
      await prisma.session.create({
        data: {
          token: sessionToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      })

      const response = NextResponse.json({
        success: true,
        user
      })

      response.cookies.set('autosync_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60
      })

      return response
    }

    // 4. Logout Action
    if (action === 'logout') {
      const sessionToken = req.cookies.get('autosync_session')?.value
      if (sessionToken) {
        await prisma.session.delete({ where: { token: sessionToken } }).catch(() => {})
      }

      const response = NextResponse.json({ success: true })
      response.cookies.set('autosync_session', '', {
        httpOnly: true,
        path: '/',
        maxAge: 0
      })
      return response
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Server authentication error' }, { status: 500 })
  }
}

// GET /api/auth: Returns authenticated user profile from session cookie
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('autosync_session')?.value
    if (!sessionToken) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        rollId: session.user.rollId,
        gender: session.user.gender,
        collegeName: session.user.collegeName
      }
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 })
  }
}
