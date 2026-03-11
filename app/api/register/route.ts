import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const RegisterSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { username, email, password } = parsed.data

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    })

    if (existing) {
      const field = existing.username === username ? 'username' : 'email'
      return NextResponse.json({ error: `That ${field} is already taken` }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.create({
      data: { username, email, passwordHash },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
