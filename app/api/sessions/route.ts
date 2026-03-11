import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SessionSchema = z.object({
  latitude: z.number().min(-35).max(-13),
  longitude: z.number().min(113).max(129),
  locationName: z.string().max(200).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fishingType: z.enum(['beach', 'boat']),
  targetType: z.enum(['pelagic', 'demersal', 'both']),
  selectedSpecies: z.array(z.string()).min(1).max(4),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = SessionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { latitude, longitude, locationName, startDate, endDate, fishingType, targetType, selectedSpecies } = parsed.data

    // Validate date range
    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxDate = new Date(today)
    maxDate.setDate(today.getDate() + 7)

    if (start < today) return NextResponse.json({ error: 'Start date cannot be in the past' }, { status: 400 })
    if (end > maxDate) return NextResponse.json({ error: 'Date range cannot exceed 7 days from today' }, { status: 400 })
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > 2) return NextResponse.json({ error: 'Date range cannot exceed 3 days' }, { status: 400 })

    const fishingSession = await prisma.fishingSession.create({
      data: {
        userId: session.user.id,
        latitude,
        longitude,
        locationName: locationName ?? null,
        startDate,
        endDate,
        fishingType,
        targetType,
        status: 'PENDING',
        selectedSpecies: {
          create: selectedSpecies.map(speciesName => ({ speciesName })),
        },
      },
    })

    return NextResponse.json({ sessionId: fishingSession.id }, { status: 201 })
  } catch (err) {
    console.error('Create session error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessions = await prisma.fishingSession.findMany({
    where: { userId: session.user.id },
    include: { selectedSpecies: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({ sessions })
}
