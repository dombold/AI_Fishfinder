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
    if (!user) {
      return NextResponse.json({ message: 'If that email is registered, a reset link has been sent.' })
    }

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 3600 * 1000)

    await prisma.passwordResetToken.create({
      data: { tokenHash, email: user.email, userId: user.id, expiresAt },
    })

    const appUrl = process.env.NEXTAUTH_URL ?? 'https://aifishfinder.com.au'
    const resetUrl = `${appUrl}/reset-password/${rawToken}`

    try {
      await sendPasswordResetEmail(user.email, user.username, resetUrl)
    } catch (emailErr) {
      console.error('[forgot-password] email send failed:', emailErr)
    }

    return NextResponse.json({ message: 'If that email is registered, a reset link has been sent.' })
  } catch (err) {
    console.error('[POST /api/auth/forgot-password]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
