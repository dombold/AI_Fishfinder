import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  species: z.string().min(1).max(100),
  quantity: z.number().int().min(1).max(1000).default(1),
  weightKg: z.number().positive().optional(),
  lengthCm: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const catches = await prisma.catchLog.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ catches })
  } catch (err: any) {
    console.error('[GET /api/catch-log]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })

    const entry = await prisma.catchLog.create({
      data: {
        userId: session.user.id,
        date: parsed.data.date,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        species: parsed.data.species,
        quantity: parsed.data.quantity,
        weightKg: parsed.data.weightKg ?? null,
        lengthCm: parsed.data.lengthCm ?? null,
        notes: parsed.data.notes ?? null,
      },
    })
    return NextResponse.json(entry, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/catch-log]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
