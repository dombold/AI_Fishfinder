import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const tokenHash = createHash('sha256').update(token).digest('hex')
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })

    if (!record || record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.delete({ where: { tokenHash } }),
    ])

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (err) {
    console.error('[POST /api/auth/reset-password]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
