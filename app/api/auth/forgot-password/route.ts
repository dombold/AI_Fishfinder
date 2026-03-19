import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    // Always return 200 to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If that email is registered, a reset link has been sent.' })
    }

    // Generate token and store SHA-256 hash
    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    const expires = new Date(Date.now() + 3600 * 1000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: tokenHash, passwordResetExpires: expires },
    })

    const appUrl = process.env.NEXTAUTH_URL ?? 'https://aifishfinder.com.au'
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`

    // Fire-and-forget
    sendPasswordResetEmail(user.email, user.username, resetUrl).catch(err =>
      console.error('[forgot-password] email send failed:', err)
    )

    return NextResponse.json({ message: 'If that email is registered, a reset link has been sent.' })
  } catch (err: any) {
    console.error('[POST /api/auth/forgot-password]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
