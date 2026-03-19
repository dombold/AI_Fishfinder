import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  email: z.string().email().optional(),
  sounderType: z.enum(['NONE', 'GARMIN', 'SIMRAD', 'LOWRANCE', 'HUMMINBIRD', 'RAYMARINE', 'FURUNO', 'B&G']).optional(),
  seasicknessTolerance: z.number().int().min(1).max(5).optional(),
  weeklyDigestOptIn: z.boolean().optional(),
  avatar: z.string().max(800000).nullable().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, email: true, sounderType: true, seasicknessTolerance: true, weeklyDigestOptIn: true, avatar: true, createdAt: true },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const savedPlans = await prisma.fishingSession.findMany({
    where: { userId: session.user.id, saved: true },
    select: {
      id: true, locationName: true, latitude: true,
      startDate: true, endDate: true, fishingType: true, createdAt: true,
      selectedSpecies: { select: { speciesName: true } },
      marineData: { select: { willyWeatherData: true }, orderBy: { date: 'asc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })

  const formattedPlans = savedPlans.map(plan => {
    const willy = plan.marineData[0]
      ? JSON.parse(plan.marineData[0].willyWeatherData as string)
      : {}
    return {
      id: plan.id, locationName: plan.locationName, latitude: plan.latitude,
      startDate: plan.startDate, endDate: plan.endDate, fishingType: plan.fishingType,
      createdAt: plan.createdAt,
      nearestStation: (willy.nearestStation as string) ?? null,
      species: plan.selectedSpecies.map(s => s.speciesName),
    }
  })

  return NextResponse.json({ ...user, savedPlans: formattedPlans })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  // Check email uniqueness if being changed
  if (parsed.data.email) {
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: { username: true, email: true, sounderType: true, seasicknessTolerance: true, weeklyDigestOptIn: true, avatar: true },
  })

  return NextResponse.json(updated)
}
