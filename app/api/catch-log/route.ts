import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getBioregion } from '@/lib/regulations'

export const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  species: z.string().min(1).max(100),
  quantity: z.number().int().min(1).max(1000).default(1),
  weightKg: z.number().positive().optional(),
  lengthCm: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
  captureTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  fishCount: z.number().int().min(1).optional(),
  environment: z.string().max(50).optional(),
  fishingMethod: z.string().max(50).optional(),
  sst: z.number().min(-5).max(40).optional(),
  tideDirection: z.enum(['incoming', 'outgoing', 'slack']).optional(),
  moonPhase: z.string().max(50).optional(),
  waterDepthM: z.number().positive().optional(),
  photoBase64: z.string().max(750000).optional(),
  shared: z.boolean().default(true),
  sharedGroupIds: z.array(z.string()).optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const catches = await prisma.catchLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: { sharedGroups: { select: { groupId: true } } },
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
    const userId = session.user.id

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })

    const entry = await prisma.$transaction(async (tx) => {
      const catch_ = await tx.catchLog.create({
        data: {
          userId,
          date: parsed.data.date,
          latitude: parsed.data.latitude,
          longitude: parsed.data.longitude,
          species: parsed.data.species,
          quantity: parsed.data.quantity,
          weightKg: parsed.data.weightKg ?? null,
          lengthCm: parsed.data.lengthCm ?? null,
          notes: parsed.data.notes ?? null,
          bioregion: getBioregion(parsed.data.latitude, parsed.data.longitude),
          captureTime: parsed.data.captureTime ?? null,
          fishCount: parsed.data.fishCount ?? null,
          environment: parsed.data.environment ?? null,
          fishingMethod: parsed.data.fishingMethod ?? null,
          sst: parsed.data.sst ?? null,
          tideDirection: parsed.data.tideDirection ?? null,
          moonPhase: parsed.data.moonPhase ?? null,
          waterDepthM: parsed.data.waterDepthM ?? null,
          photoBase64: parsed.data.photoBase64 ?? null,
          shared: parsed.data.shared,
        },
      })

      const requestedIds = parsed.data.sharedGroupIds ?? []
      if (!parsed.data.shared && requestedIds.length > 0) {
        const memberships = await tx.groupMembership.findMany({
          where: { userId, groupId: { in: requestedIds }, status: 'ACTIVE' },
          select: { groupId: true },
        })
        const validIds = memberships.map(m => m.groupId)
        if (validIds.length > 0) {
          await tx.catchLogSharedGroup.createMany({
            data: validIds.map(groupId => ({ catchLogId: catch_.id, groupId })),
            skipDuplicates: true,
          })
        }
      }
      return catch_
    })
    return NextResponse.json(entry, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/catch-log]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
